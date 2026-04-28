import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Crear colección
export const createCollectionSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es requerido' })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120, 'El nombre no puede exceder 120 caracteres')
      .trim(),
    description: z.string().max(500).trim().optional(),
    // Acepta URL válida o string vacío (sentinel para borrar imagen)
    image: z
      .union([z.string().url('URL de imagen inválida').max(500), z.literal('')])
      .optional(),
    emoji: z.string().max(8).optional(),
    gradient: z.string().max(120).optional(),
    products: z.array(objectIdSchema).optional(),
    active: z.boolean().optional(),
    showOnHome: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

// Actualizar colección
export const updateCollectionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z
      .string()
      .min(2)
      .max(120)
      .trim()
      .optional(),
    description: z.string().max(500).trim().optional(),
    // Acepta URL válida o string vacío (sentinel para borrar imagen)
    image: z
      .union([z.string().url('URL de imagen inválida').max(500), z.literal('')])
      .optional(),
    emoji: z.string().max(8).optional(),
    gradient: z.string().max(120).optional(),
    products: z.array(objectIdSchema).optional(),
    active: z.boolean().optional(),
    showOnHome: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const getCollectionByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getCollectionBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug requerido'),
  }),
});

export const deleteCollectionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getCollectionsQuerySchema = z.object({
  query: z.object({
    showOnHome: z.enum(['true', 'false']).optional(),
    active: z.enum(['true', 'false', 'all']).optional(),
    search: z.string().max(120).optional(),
  }),
});

export const getCollectionProductsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
  }),
});

export const reorderCollectionsSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          id: objectIdSchema,
          order: z.number().int().min(0),
        })
      )
      .min(1, 'Se requiere al menos una colección'),
  }),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
