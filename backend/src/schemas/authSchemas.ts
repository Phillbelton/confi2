import { z } from 'zod';
import { strongPasswordSchema } from './userSchemas';

/**
 * Schemas de validación para autenticación.
 *
 * La política de complejidad de password está centralizada en
 * `strongPasswordSchema` (userSchemas.ts) y se reusa acá para no caer
 * en asimetrías (registro público con regla X, admin con regla Y, etc).
 */

// Schema para registro de usuario
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim(),

    email: z
      .string({
        required_error: 'El email es requerido',
      })
      .email('Email inválido')
      .toLowerCase()
      .trim(),

    password: strongPasswordSchema,

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
      .optional(),
  }),
});

// Schema para login
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
      })
      .email('Email inválido')
      .toLowerCase()
      .trim(),

    password: z.string({
      required_error: 'La contraseña es requerida',
    }),
  }),
});

// Schema para forgot password
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
      })
      .email('Email inválido')
      .toLowerCase()
      .trim(),
  }),
});

// Schema para reset password
export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string({
      required_error: 'Token requerido',
    }),
  }),
  body: z.object({
    newPassword: strongPasswordSchema,

    confirmPassword: z.string({
      required_error: 'Confirmar contraseña es requerido',
    }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }),
});

// Schema para change password
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: 'La contraseña actual es requerida',
    }),

    newPassword: strongPasswordSchema,

    confirmPassword: z.string({
      required_error: 'Confirmar contraseña es requerido',
    }),
  })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'La nueva contraseña debe ser diferente a la actual',
      path: ['newPassword'],
    }),
});

// Schema para actualizar perfil
export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim()
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
      .optional(),

    email: z
      .string()
      .email('Email inválido')
      .toLowerCase()
      .trim()
      .optional(),
  }),
});

// Tipos TypeScript inferidos
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
