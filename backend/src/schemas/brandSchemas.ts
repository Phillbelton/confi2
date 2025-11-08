import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para marcas
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para crear marca
export const createBrandSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim(),

    logo: z
      .string()
      .url('URL de logo inválida')
      .max(500, 'La URL del logo no puede exceder 500 caracteres')
      .optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para actualizar marca
export const updateBrandSchema = z.object({
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

    logo: z
      .string()
      .url('URL de logo inválida')
      .max(500, 'La URL del logo no puede exceder 500 caracteres')
      .optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para obtener marca por ID
export const getBrandByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para obtener marca por slug
export const getBrandBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug requerido'),
  }),
});

// Schema para eliminar marca
export const deleteBrandSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para query params de listado
export const getBrandsQuerySchema = z.object({
  query: z.object({
    includeInactive: z.enum(['true', 'false']).optional(),
    search: z.string().max(100).optional(),
  }),
});

// Tipos TypeScript inferidos
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type GetBrandByIdInput = z.infer<typeof getBrandByIdSchema>;
export type GetBrandBySlugInput = z.infer<typeof getBrandBySlugSchema>;
export type DeleteBrandInput = z.infer<typeof deleteBrandSchema>;
export type GetBrandsQueryInput = z.infer<typeof getBrandsQuerySchema>;
