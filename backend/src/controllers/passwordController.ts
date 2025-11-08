import { Response } from 'express';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, ApiResponse } from '../types';
import { User } from '../models/User';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { emailService } from '../services/emailService';

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de contraseña (envía email con token)
 * @access  Public
 */
export const forgotPassword = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { email } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ email, active: true });

    // IMPORTANTE: Por seguridad, siempre retornar el mismo mensaje
    // No revelar si el email existe o no en la DB (previene enumeración de usuarios)
    const successMessage =
      'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.';

    if (!user) {
      // Email no existe, pero retornar mensaje genérico
      res.status(200).json({
        success: true,
        message: successMessage,
      });
      return;
    }

    // Generar token de reset
    const { token, hashedToken } = await (PasswordResetToken as any).createResetToken(
      user._id,
      1 // Expira en 1 hora
    );

    // Enviar email con el token
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.name
    );

    if (!emailSent) {
      throw new AppError(
        500,
        'Error enviando email. Intenta nuevamente más tarde.'
      );
    }

    res.status(200).json({
      success: true,
      message: successMessage,
    });
  }
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Restablecer contraseña usando token
 * @access  Public
 */
export const resetPassword = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validar y consumir token
    const validation = await (PasswordResetToken as any).validateAndConsumeToken(
      token
    );

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
    await user.save(); // El pre-save hook hasheará automáticamente

    // Resetear intentos de login fallidos (si existen)
    if ((user as any).loginAttempts) {
      (user as any).loginAttempts = 0;
      (user as any).lockUntil = undefined;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
    });
  }
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña (usuario autenticado)
 * @access  Private
 */
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { currentPassword, newPassword } = req.body;

    // Buscar usuario con contraseña incluida
    const user = await User.findById(req.user?.id).select('+password');

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
    await user.save(); // El pre-save hook hasheará automáticamente

    res.status(200).json({
      success: true,
      message: 'Contraseña cambiada exitosamente',
    });
  }
);
