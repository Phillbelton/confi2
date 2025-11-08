import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para tags (etiquetas)
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para crear tag
export const createTagSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .trim(),

    description: z
      .string()
      .max(200, 'La descripción no puede exceder 200 caracteres')
      .trim()
      .optional(),

    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido (ej: #10B981)')
      .optional(),

    order: z
      .number()
      .int('El orden debe ser un número entero')
      .min(0, 'El orden no puede ser negativo')
      .optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para actualizar tag
export const updateTagSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .trim()
      .optional(),

    description: z
      .string()
      .max(200, 'La descripción no puede exceder 200 caracteres')
      .trim()
      .optional(),

    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido (ej: #10B981)')
      .optional(),

    order: z
      .number()
      .int('El orden debe ser un número entero')
      .min(0, 'El orden no puede ser negativo')
      .optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para obtener tag por ID
export const getTagByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para obtener tag por slug
export const getTagBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug requerido'),
  }),
});

// Schema para eliminar tag
export const deleteTagSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para query params de listado
export const getTagsQuerySchema = z.object({
  query: z.object({
    includeInactive: z.enum(['true', 'false']).optional(),
    search: z.string().max(100).optional(),
  }),
});

// Schema para get or create tag
export const getOrCreateTagSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .trim(),
  }),
});

// Tipos TypeScript inferidos
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type GetTagByIdInput = z.infer<typeof getTagByIdSchema>;
export type GetTagBySlugInput = z.infer<typeof getTagBySlugSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
export type GetTagsQueryInput = z.infer<typeof getTagsQuerySchema>;
export type GetOrCreateTagInput = z.infer<typeof getOrCreateTagSchema>;
