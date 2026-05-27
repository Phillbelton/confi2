/**
 * Auth Service
 *
 * Capa de servicio para autenticación y gestión de usuarios.
 * Contiene toda la lógica de negocio relacionada con auth,
 * separada de los controllers.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { emailService } from './emailService';
import { ENV } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { TokenPayload } from '../types';
import { invalidateUserStateCache } from '../middleware/auth';
import logger from '../config/logger';

const JWT_ALGORITHM = 'HS256' as const;

/**
 * Hash dummy precomputado para neutralizar timing attacks en login. Cuando el
 * email no existe, igualmente se ejecuta un bcrypt.compare contra este hash
 * para que la latencia sea indistinguible del caso "usuario existe + password
 * incorrecta". El plaintext es irrelevante; es solo un costo computacional.
 */
const DUMMY_BCRYPT_HASH = bcrypt.hashSync('dummy-password-for-timing-defense', 10);

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'cliente' | 'funcionario' | 'admin';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  user: IUser;
  token: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Arma el payload del JWT a partir del documento de usuario. Incluye
   * `tv` (token version): si el valor en DB se incrementa, todos los
   * tokens emitidos previamente con la versión anterior quedan inválidos.
   */
  private buildPayload(user: IUser): TokenPayload {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    };
  }

  /**
   * Genera ambos tokens (access + refresh) a partir del payload base.
   * Algoritmo HS256 explícito para evitar algorithm confusion.
   */
  private issueTokens(user: IUser): { token: string; refreshToken: string } {
    const payload = this.buildPayload(user);
    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
      algorithm: JWT_ALGORITHM,
    } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
      algorithm: JWT_ALGORITHM,
    } as jwt.SignOptions);
    return { token, refreshToken };
  }

  /**
   * Registrar nuevo usuario PÚBLICO.
   *
   * El rol siempre se fuerza a 'cliente' acá. Cualquier `role` que venga
   * en el DTO se ignora explícitamente — no confiamos en pickeo del
   * controller como única defensa. La creación de funcionarios/admins
   * pasa por POST /api/users (admin-only).
   */
  async register(data: RegisterDTO): Promise<AuthResult> {
    // Normalizar email a minúsculas para comparación
    const normalizedEmail = data.email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(400, 'El email ya está registrado');
    }

    // Crear usuario (con manejo de error de duplicado como segunda línea de defensa)
    let user;
    try {
      user = await User.create({
        name: data.name,
        email: normalizedEmail,
        password: data.password, // Se hasheará en el pre-save hook
        phone: data.phone,
        // ROLE FORZADO. Ignoramos data.role aquí intencionalmente: ningún
        // registro público puede crear funcionarios o admins.
        role: 'cliente',
        active: true,
      });
    } catch (error: any) {
      // Capturar error de índice duplicado de MongoDB (code 11000)
      if (error.code === 11000) {
        throw new AppError(400, 'El email ya está registrado');
      }
      throw error;
    }

    const { token, refreshToken } = this.issueTokens(user);

    // Enviar email de bienvenida (no bloqueante)
    if (user.role === 'cliente') {
      emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
        logger.error('Error enviando email de bienvenida', { error: err });
      });
    }

    return { user, token, refreshToken };
  }

  /**
   * Login de usuario.
   *
   * Orden de verificación blindado contra timing y user-enumeration:
   *   1. Buscar el user (silenciosamente — sin filtrar por active).
   *   2. SIEMPRE ejecutar bcrypt.compare, incluso si el user no existe
   *      (contra DUMMY_BCRYPT_HASH). Eso iguala la latencia y previene
   *      enumerar emails registrados midiendo el tiempo de respuesta.
   *   3. Si la password no matchea (o no había user): 401 genérico. Solo
   *      incrementamos loginAttempts si el user existe — para no inflar
   *      el contador sobre emails desconocidos.
   *   4. Solo cuando la password fue VERIFICADA, chequear estado:
   *      - active=false → 403
   *      - locked → 423
   *      Esto evita que un atacante distinga "usuario activo con pw mala"
   *      de "usuario desactivado con pw mala" sin tener la pw correcta.
   *   5. Si todo OK, reset attempts + emitir tokens.
   */
  async login(credentials: LoginDTO): Promise<AuthResult> {
    const user = await User.findOne({ email: credentials.email }).select('+password');

    const passwordHash = user ? user.password : DUMMY_BCRYPT_HASH;
    const passwordOk = await bcrypt.compare(credentials.password, passwordHash);

    if (!user || !passwordOk) {
      if (user) {
        // Solo incrementamos contra usuarios existentes para no inflar
        // intentos en emails que ni siquiera están registrados.
        await user.incrementLoginAttempts();
      }
      throw new AppError(401, 'Credenciales inválidas');
    }

    if (!user.active) {
      throw new AppError(403, 'Cuenta desactivada. Contacta a soporte.');
    }

    if (user.isLocked()) {
      throw new AppError(
        423,
        'Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intenta de nuevo más tarde.'
      );
    }

    await user.resetLoginAttempts();

    const { token, refreshToken } = this.issueTokens(user);
    return { user, token, refreshToken };
  }

  /**
   * Refresh token.
   *
   * Verifica con algoritmo HS256 explícito y valida la `tv` (token version)
   * contra el valor actual del usuario en DB. Si la version no coincide
   * (ej. el usuario cambió la password después de emitir el refresh
   * token), el refresh queda inválido — el cliente debe volver a loguear.
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET, {
        algorithms: [JWT_ALGORITHM],
      }) as TokenPayload;

      const user = await User.findById(decoded.id);

      if (!user || !user.active) {
        throw new AppError(401, 'Usuario no encontrado o inactivo');
      }

      if ((user.tokenVersion ?? 0) !== decoded.tv) {
        throw new AppError(401, 'Refresh token revocado');
      }

      const tokens = this.issueTokens(user);
      return { user, token: tokens.token, refreshToken: tokens.refreshToken };
    } catch (error) {
      // Preservar AppError (incluye nuestro 'Refresh token revocado');
      // cualquier otro error de jwt cae al genérico.
      if (error instanceof AppError) throw error;
      throw new AppError(401, 'Refresh token inválido o expirado');
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Actualizar campos
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    // El email NO se puede cambiar desde el perfil (solo desde admin o endpoint dedicado)

    await user.save();

    return user;
  }

  /**
   * Solicitar reset de contraseña (forgot password)
   */
  async forgotPassword(email: string): Promise<void> {
    // Buscar usuario
    const user = await User.findOne({ email, active: true });

    // Por seguridad, siempre retornar éxito (no revelar si el email existe)
    if (!user) {
      return;
    }

    // Generar token de reset
    const { token } = await (PasswordResetToken as any).createResetToken(user._id, 1);

    // Enviar email con el token
    const emailSent = await emailService.sendPasswordResetEmail(user.email, token, user.name);

    if (!emailSent) {
      throw new AppError(500, 'Error enviando email. Intenta nuevamente más tarde.');
    }
  }

  /**
   * Restablecer contraseña con token. Al cambiar la password se incrementa
   * `tokenVersion`, lo que invalida cualquier JWT/refresh emitido antes
   * (defensa contra el caso "robaron mi cuenta, cambio password pero el
   * atacante mantiene su sesión vigente"). También se purga el caché de
   * estado en memoria del middleware auth para que la propagación sea
   * inmediata, sin esperar el TTL.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const validation = await (PasswordResetToken as any).validateAndConsumeToken(token);

    if (!validation.valid) {
      throw new AppError(400, validation.message || 'Token inválido o expirado');
    }

    const user = await User.findById(validation.userId);

    if (!user || !user.active) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    invalidateUserStateCache(user._id.toString());
  }

  /**
   * Cambiar contraseña (usuario autenticado). Mismo blindaje que
   * resetPassword: incrementa tokenVersion para forzar re-login en TODAS
   * las sesiones del usuario.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError(401, 'Contraseña actual incorrecta');
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    invalidateUserStateCache(user._id.toString());
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    return user;
  }

  /**
   * Verificar si un teléfono ya está registrado
   * No revela datos del usuario, solo true/false
   */
  async checkPhoneExists(phone: string): Promise<boolean> {
    // Normalizar: quitar espacios, asegurar formato +56
    const cleaned = phone.replace(/\s/g, '');
    const normalized = cleaned.startsWith('+56') ? cleaned : `+56${cleaned}`;

    const user = await User.findOne({
      phone: normalized,
      active: true,
    }).select('_id').lean();

    return !!user;
  }
}

// Exportar instancia singleton
export const authService = new AuthService();
