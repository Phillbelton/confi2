/**
 * Auth Service
 *
 * Capa de servicio para autenticación y gestión de usuarios.
 * Contiene toda la lógica de negocio relacionada con auth,
 * separada de los controllers.
 */

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { emailService } from './emailService';
import { ENV } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { TokenPayload } from '../types';

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
   * Generar JWT access token
   */
  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generar refresh token
   */
  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Registrar nuevo usuario
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
        role: data.role || 'cliente',
        active: true,
      });
    } catch (error: any) {
      // Capturar error de índice duplicado de MongoDB (code 11000)
      if (error.code === 11000) {
        throw new AppError(400, 'El email ya está registrado');
      }
      throw error;
    }

    // Generar tokens
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = this.generateToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { user, token, refreshToken };
  }

  /**
   * Login de usuario
   */
  async login(credentials: LoginDTO): Promise<AuthResult> {
    // Buscar usuario con contraseña incluida (sin filtrar por active primero)
    const user = await User.findOne({ email: credentials.email }).select('+password');

    if (!user) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    // Verificar si la cuenta está activa
    if (!user.active) {
      throw new AppError(403, 'Cuenta desactivada. Contacta a soporte.');
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked()) {
      throw new AppError(
        423,
        'Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intenta de nuevo más tarde.'
      );
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(credentials.password);

    if (!isMatch) {
      // Incrementar intentos fallidos
      await user.incrementLoginAttempts();
      throw new AppError(401, 'Credenciales inválidas');
    }

    // Reset intentos fallidos si el login es exitoso
    await user.resetLoginAttempts();

    // Generar tokens
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = this.generateToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { user, token, refreshToken };
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as TokenPayload;

      // Buscar usuario
      const user = await User.findById(decoded.id);

      if (!user || !user.active) {
        throw new AppError(401, 'Usuario no encontrado o inactivo');
      }

      // Generar nuevos tokens
      const payload: TokenPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const newToken = this.generateToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      return { user, token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
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
   * Restablecer contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validar y consumir token
    const validation = await (PasswordResetToken as any).validateAndConsumeToken(token);

    if (!validation.valid) {
      throw new AppError(400, validation.message || 'Token inválido o expirado');
    }

    // Buscar usuario
    const user = await User.findById(validation.userId);

    if (!user || !user.active) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    // Resetear intentos de login fallidos
    if ((user as any).loginAttempts) {
      (user as any).loginAttempts = 0;
      (user as any).lockUntil = undefined;
      await user.save();
    }
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Buscar usuario con contraseña incluida
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError(401, 'Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
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
}

// Exportar instancia singleton
export const authService = new AuthService();
