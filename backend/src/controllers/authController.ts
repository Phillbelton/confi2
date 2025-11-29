import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest, ApiResponse, TokenPayload } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ENV } from '../config/env';
import { validatePassword, getPasswordErrorMessage } from '../utils/passwordValidator';

// Generar JWT Token
const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

// Generar Refresh Token
const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

// Set token en cookie
const setTokenCookie = (res: Response, token: string, refreshToken: string) => {
  const isProduction = ENV.NODE_ENV === 'production';
  const isTest = ENV.NODE_ENV === 'test';

  // En producción y tests, usar cookies httpOnly
  if (isProduction || isTest) {
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Solo secure en producción (tests usan HTTP)
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    };

    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });
  }
  // En development, las cookies no funcionan cross-port en localhost
  // El token ya está en response body para que frontend lo almacene
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { name, email, password, phone } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'El email ya está registrado');
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'cliente',
    });

    // Generar tokens
    const tokenPayload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set cookies
    setTokenCookie(res, token, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  }
);

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { email, password } = req.body;

    // Buscar usuario (incluir password que está en select: false)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    // Verificar si la cuenta está activa
    if (!user.active) {
      throw new AppError(403, 'Cuenta desactivada. Contacta a soporte.');
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked()) {
      const lockMinutes = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
      throw new AppError(
        423,
        `Cuenta bloqueada por múltiples intentos fallidos. Intenta nuevamente en ${lockMinutes} minuto(s).`
      );
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      await user.incrementLoginAttempts();

      // Si ahora está bloqueada después del incremento, informar al usuario
      if (user.isLocked()) {
        throw new AppError(
          423,
          'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por 15 minutos.'
        );
      }

      throw new AppError(401, 'Credenciales inválidas');
    }

    // Login exitoso: resetear intentos fallidos
    await user.resetLoginAttempts();

    // Generar tokens
    const tokenPayload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set cookies
    setTokenCookie(res, token, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  }
);

// @desc    Logout de usuario
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const isProduction = ENV.NODE_ENV === 'production';
    const isTest = ENV.NODE_ENV === 'test';

    // En producción y tests, limpiar cookies con las mismas opciones que fueron seteadas
    if (isProduction || isTest) {
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
      };

      res.clearCookie('token', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
    }

    res.status(200).json({
      success: true,
      message: 'Logout exitoso',
    });
  }
);

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    if (!req.user) {
      throw new AppError(401, 'No autenticado');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
        },
      },
    });
  }
);

// @desc    Actualizar perfil de usuario
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    if (!req.user) {
      throw new AppError(401, 'No autenticado');
    }

    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Actualizar campos
    if (name) user.name = name;
    if (phone) user.phone = phone;
    // Note: addresses se gestionan mediante /api/users/me/addresses

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
        },
      },
    });
  }
);

// @desc    Cambiar contraseña
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    if (!req.user) {
      throw new AppError(401, 'No autenticado');
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(401, 'Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  }
);

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const refreshTokenFromCookie = req.cookies?.refreshToken;

    if (!refreshTokenFromCookie) {
      throw new AppError(401, 'Refresh token no proporcionado');
    }

    try {
      // Verificar refresh token
      const decoded = jwt.verify(
        refreshTokenFromCookie,
        ENV.JWT_REFRESH_SECRET
      ) as TokenPayload;

      // Verificar que el usuario existe
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      // Generar nuevos tokens
      const tokenPayload: TokenPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const newToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      // Set cookies
      setTokenCookie(res, newToken, newRefreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      throw new AppError(401, 'Refresh token inválido o expirado');
    }
  }
);
