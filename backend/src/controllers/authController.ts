/**
 * Auth Controller
 *
 * Controlador delgado que delega lógica de negocio al AuthService.
 * Responsable solo de:
 * - Extraer datos del request
 * - Llamar al service apropiado
 * - Formatear y enviar respuesta
 * - Manejar cookies
 */

import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { authService } from '../services/AuthService';
import { successResponse, SuccessMessages } from '../utils/responseHelpers';
import { ENV } from '../config/env';

/**
 * Helper para establecer cookies de autenticación
 */
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

/**
 * @desc    Registrar nuevo usuario
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { name, email, password, phone } = req.body;

  // Delegar lógica al service
  const { user, token, refreshToken } = await authService.register({
    name,
    email,
    password,
    phone,
  });

  // Establecer cookies
  setTokenCookie(res, token, refreshToken);

  // Enviar respuesta
  res.status(201).json(
    successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
        refreshToken,
      },
      SuccessMessages.REGISTER
    )
  );
});

/**
 * @desc    Login de usuario
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { email, password } = req.body;

  // Delegar lógica al service
  const { user, token, refreshToken } = await authService.login({ email, password });

  // Establecer cookies
  setTokenCookie(res, token, refreshToken);

  // Enviar respuesta
  res.status(200).json(
    successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
        refreshToken,
      },
      SuccessMessages.LOGIN
    )
  );
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  // Delegar lógica al service
  const { user, token, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);

  // Establecer nuevas cookies
  setTokenCookie(res, token, newRefreshToken);

  // Enviar respuesta
  res.status(200).json(
    successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken: newRefreshToken,
    })
  );
});

/**
 * @desc    Logout de usuario
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
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

  res.status(200).json(successResponse({}, SuccessMessages.LOGOUT));
});

/**
 * @desc    Obtener usuario actual
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  // Delegar lógica al service
  const user = await authService.getUserById(req.user.id);

  res.status(200).json(
    successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        createdAt: user.createdAt,
      },
    })
  );
});

/**
 * @desc    Actualizar perfil de usuario
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  const { name, phone, email } = req.body;

  // Delegar lógica al service
  const user = await authService.updateProfile(req.user.id, { name, phone, email });

  res.status(200).json(
    successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      SuccessMessages.UPDATED
    )
  );
});
