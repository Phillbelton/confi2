import { z } from 'zod';

/**
 * Schemas de validación para autenticación
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

    password: z
      .string({
        required_error: 'La contraseña es requerida',
      })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'La contraseña debe contener al menos un carácter especial'
      ),

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
    newPassword: z
      .string({
        required_error: 'La nueva contraseña es requerida',
      })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'La contraseña debe contener al menos un carácter especial'
      ),

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

    newPassword: z
      .string({
        required_error: 'La nueva contraseña es requerida',
      })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'La contraseña debe contener al menos un carácter especial'
      ),

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
