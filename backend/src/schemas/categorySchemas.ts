import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para categorías
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para crear categoría
export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim(),

    description: z
      .string()
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .trim()
      .optional(),

    parent: objectIdSchema.optional(),

    icon: z
      .string()
      .max(50, 'El icono no puede exceder 50 caracteres')
      .optional(),

    active: z.boolean().optional(),

    order: z
      .number()
      .int('El orden debe ser un número entero')
      .min(0, 'El orden no puede ser negativo')
      .optional(),
  }),
});

// Schema para actualizar categoría
export const updateCategorySchema = z.object({
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

    description: z
      .string()
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .trim()
      .optional(),

    parent: objectIdSchema.nullable().optional(),

    icon: z
      .string()
      .max(50, 'El icono no puede exceder 50 caracteres')
      .optional(),

    active: z.boolean().optional(),

    order: z
      .number()
      .int('El orden debe ser un número entero')
      .min(0, 'El orden no puede ser negativo')
      .optional(),
  }),
});

// Schema para obtener categoría por ID
export const getCategoryByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para query params de listado
export const getCategoriesQuerySchema = z.object({
  query: z.object({
    includeInactive: z.enum(['true', 'false']).optional(),
    parent: objectIdSchema.optional(),
    search: z.string().max(100).optional(),
  }),
});

// Schema para obtener categoría por slug
export const getCategoryBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'El slug es requerido'),
  }),
});

// Schema para obtener subcategorías
export const getSubcategoriesSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para eliminar categoría
export const deleteCategorySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Tipos TypeScript inferidos
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoryByIdInput = z.infer<typeof getCategoryByIdSchema>;
export type GetCategoriesQueryInput = z.infer<typeof getCategoriesQuerySchema>;
export type GetCategoryBySlugInput = z.infer<typeof getCategoryBySlugSchema>;
export type GetSubcategoriesInput = z.infer<typeof getSubcategoriesSchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
