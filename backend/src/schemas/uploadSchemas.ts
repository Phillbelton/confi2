import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para upload de archivos
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para upload de imágenes de ProductParent
export const uploadProductParentImagesSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para eliminar imagen de ProductParent
export const deleteProductParentImageSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    filename: z
      .string({
        required_error: 'El nombre del archivo es requerido',
      })
      .min(1, 'El nombre del archivo no puede estar vacío')
      .max(255, 'El nombre del archivo es demasiado largo')
      .regex(/^[a-zA-Z0-9_\-\.]+$/, 'Nombre de archivo inválido'),
  }),
});

// Schema para upload de imágenes de ProductVariant
export const uploadProductVariantImagesSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para eliminar imagen de ProductVariant
export const deleteProductVariantImageSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    filename: z
      .string({
        required_error: 'El nombre del archivo es requerido',
      })
      .min(1, 'El nombre del archivo no puede estar vacío')
      .max(255, 'El nombre del archivo es demasiado largo')
      .regex(/^[a-zA-Z0-9_\-\.]+$/, 'Nombre de archivo inválido'),
  }),
});

// Schema para upload de imagen de Category
export const uploadCategoryImageSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para upload de logo de Brand
export const uploadBrandLogoSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Tipos TypeScript inferidos
export type UploadProductParentImagesInput = z.infer<typeof uploadProductParentImagesSchema>;
export type DeleteProductParentImageInput = z.infer<typeof deleteProductParentImageSchema>;
export type UploadProductVariantImagesInput = z.infer<typeof uploadProductVariantImagesSchema>;
export type DeleteProductVariantImageInput = z.infer<typeof deleteProductVariantImageSchema>;
export type UploadCategoryImageInput = z.infer<typeof uploadCategoryImageSchema>;
export type UploadBrandLogoInput = z.infer<typeof uploadBrandLogoSchema>;
