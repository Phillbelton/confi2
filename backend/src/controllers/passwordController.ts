/**
 * Password Controller
 *
 * Controlador delgado para operaciones de contraseña.
 * Delega lógica de negocio al AuthService.
 */

import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { authService } from '../services/AuthService';
import { successResponse, SuccessMessages } from '../utils/responseHelpers';

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de contraseña (envía email con token)
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { email } = req.body;

  // Delegar lógica al service
  await authService.forgotPassword(email);

  // IMPORTANTE: Por seguridad, siempre retornar el mismo mensaje
  // No revelar si el email existe o no en la DB (previene enumeración de usuarios)
  const successMessage =
    'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.';

  res.status(200).json(successResponse({}, successMessage));
});

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Restablecer contraseña usando token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Delegar lógica al service
  await authService.resetPassword(token, newPassword);

  res.status(200).json(
    successResponse({}, 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.')
  );
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña (usuario autenticado)
 * @access  Private
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  // Delegar lógica al service
  await authService.changePassword(req.user.id, currentPassword, newPassword);

  res.status(200).json(successResponse({}, SuccessMessages.PASSWORD_CHANGED));
});
