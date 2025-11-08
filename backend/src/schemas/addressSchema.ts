import { z } from 'zod';

/**
 * Schema de validación para direcciones
 */

export const addressSchema = z.object({
  label: z.string()
    .min(1, 'El nombre de la dirección es requerido')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),

  street: z.string()
    .min(3, 'La calle debe tener al menos 3 caracteres')
    .max(200, 'La calle no puede exceder 200 caracteres')
    .trim(),

  number: z.string()
    .min(1, 'El número es requerido')
    .max(20, 'El número no puede exceder 20 caracteres')
    .trim(),

  city: z.string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim(),

  neighborhood: z.string()
    .max(100, 'El barrio no puede exceder 100 caracteres')
    .trim()
    .optional(),

  reference: z.string()
    .max(500, 'Las referencias no pueden exceder 500 caracteres')
    .trim()
    .optional(),

  isDefault: z.boolean()
    .default(false)
});

// Schema para crear dirección (sin isDefault, se maneja automáticamente)
export const createAddressSchema = addressSchema.omit({ isDefault: true });

// Schema para actualizar dirección (todos los campos opcionales excepto label)
export const updateAddressSchema = addressSchema.partial();

// Schema para validar el ID de la dirección en params
export const addressIdSchema = z.object({
  id: z.string()
    .min(1, 'El ID de la dirección es requerido')
    .regex(/^[0-9a-fA-F]{24}$/, 'El ID de la dirección no es válido'),
});

// Tipos inferidos
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdInput = z.infer<typeof addressIdSchema>;
