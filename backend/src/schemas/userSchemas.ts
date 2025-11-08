import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para usuarios
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para dirección
const addressSchema = z.object({
  label: z
    .string({
      required_error: 'El nombre de la dirección es requerido',
    })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),

  street: z
    .string({
      required_error: 'La calle es requerida',
    })
    .min(3, 'La calle debe tener al menos 3 caracteres')
    .max(200, 'La calle no puede exceder 200 caracteres')
    .trim(),

  number: z
    .string({
      required_error: 'El número es requerido',
    })
    .max(20, 'El número no puede exceder 20 caracteres')
    .trim(),

  city: z
    .string({
      required_error: 'La ciudad es requerida',
    })
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim(),

  neighborhood: z
    .string()
    .max(100, 'El barrio no puede exceder 100 caracteres')
    .trim()
    .optional(),

  reference: z
    .string()
    .max(500, 'Las referencias no pueden exceder 500 caracteres')
    .trim()
    .optional(),

  isDefault: z.boolean().optional(),
});

// Schema para crear usuario (admin)
export const createUserSchema = z.object({
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
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),

    role: z.enum(['cliente', 'funcionario', 'admin'], {
      errorMap: () => ({ message: 'Rol inválido' }),
    }),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
      .optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para actualizar usuario
export const updateUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim()
      .optional(),

    email: z
      .string()
      .email('Email inválido')
      .toLowerCase()
      .trim()
      .optional(),

    role: z
      .enum(['cliente', 'funcionario', 'admin'], {
        errorMap: () => ({ message: 'Rol inválido' }),
      })
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
      .optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para agregar dirección
export const addAddressSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: addressSchema,
});

// Schema para actualizar dirección
export const updateAddressSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
    addressId: objectIdSchema,
  }),
  body: addressSchema.partial(),
});

// Schema para eliminar dirección
export const deleteAddressSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
    addressId: objectIdSchema,
  }),
});

// Schema para marcar dirección como predeterminada
export const setDefaultAddressSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
    addressId: objectIdSchema,
  }),
});

// Schema para obtener usuario por ID
export const getUserByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para query params de listado
export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    role: z.enum(['cliente', 'funcionario', 'admin']).optional(),
    active: z.enum(['true', 'false']).optional(),
    search: z.string().max(100).optional(),
  }),
});

// Schema para cambiar contraseña de usuario (admin)
export const changeUserPasswordSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    newPassword: z
      .string({
        required_error: 'La nueva contraseña es requerida',
      })
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
});

// Schema para activar/desactivar usuario
export const toggleUserActiveSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Tipos TypeScript inferidos
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AddAddressInput = z.infer<typeof addAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type DeleteAddressInput = z.infer<typeof deleteAddressSchema>;
export type SetDefaultAddressInput = z.infer<typeof setDefaultAddressSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;
