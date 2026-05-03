import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), { message: 'ID inválido' });

const optionalObjectIdSchema = z
  .string()
  .nullish()
  .refine((v) => !v || mongoose.Types.ObjectId.isValid(v), { message: 'ID inválido' });

const saleUnitSchema = z.object({
  type: z.enum(['unidad', 'cantidadMinima', 'display', 'embalaje']),
  quantity: z.number().int().min(1),
});

const tierSchema = z.object({
  minQuantity: z.number().int().min(1),
  pricePerUnit: z.number().min(0),
  label: z.string().max(40).optional(),
});

const fixedDiscountSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(['percentage', 'amount']),
  value: z.number().positive(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  badge: z.string().optional(),
});

// ============================================================
// Product
// ============================================================

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(200).trim(),
    description: z.string().min(10).max(5000).trim(),
    categories: z.array(objectIdSchema).min(1, 'Debe seleccionar al menos una categoría'),
    brand: objectIdSchema.optional(),
    format: objectIdSchema.optional(),
    flavor: objectIdSchema.optional(),
    barcode: z.string().trim().max(32).optional(),
    provider: z.string().trim().max(120).optional(),

    unitPrice: z.number().min(0),
    saleUnit: saleUnitSchema,
    tiers: z.array(tierSchema).optional(),
    fixedDiscount: fixedDiscountSchema.optional(),

    images: z.array(z.string()).max(5).optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    attributes: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().min(3).max(200).trim().optional(),
    description: z.string().min(10).max(5000).trim().optional(),
    categories: z.array(objectIdSchema).min(1).optional(),
    brand: optionalObjectIdSchema,
    format: optionalObjectIdSchema,
    flavor: optionalObjectIdSchema,
    barcode: z.string().trim().max(32).optional(),
    provider: z.string().trim().max(120).optional(),

    unitPrice: z.number().min(0).optional(),
    saleUnit: saleUnitSchema.optional(),
    tiers: z.array(tierSchema).optional(),
    fixedDiscount: fixedDiscountSchema.optional(),

    images: z.array(z.string()).max(5).optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    attributes: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export const getProductByIdSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const getProductBySlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const deleteProductSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    category: z.string().optional(), // slug or ID
    categories: z.string().optional(), // comma-separated
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    brands: z.string().optional(),
    format: z.string().optional(),
    flavor: z.string().optional(),
    minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    active: z.enum(['true', 'false', 'all']).optional(),
    featured: z.enum(['true', 'false']).optional(),
    onSale: z.enum(['true', 'false']).optional(),
    search: z.string().max(100).optional(),
    collection: z.string().optional(),
    sort: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest', 'popular']).optional(),
  }),
});

export const getFeaturedProductsSchema = z.object({
  query: z.object({ limit: z.string().regex(/^\d+$/).optional() }),
});

// ============================================================
// Format
// ============================================================

export const createFormatSchema = z.object({
  body: z.object({
    value: z.number().min(0),
    unit: z.enum(['g', 'kg', 'ml', 'l', 'cc', 'oz']),
    label: z.string().max(40).optional(),
    active: z.boolean().optional(),
  }),
});

export const updateFormatSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    value: z.number().min(0).optional(),
    unit: z.enum(['g', 'kg', 'ml', 'l', 'cc', 'oz']).optional(),
    label: z.string().max(40).optional(),
    active: z.boolean().optional(),
  }),
});

// ============================================================
// Flavor
// ============================================================

export const createFlavorSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).trim(),
    color: z
      .string()
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hex inválido')
      .optional(),
    active: z.boolean().optional(),
  }),
});

export const updateFlavorSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().min(2).max(60).trim().optional(),
    color: z
      .string()
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hex inválido')
      .optional(),
    active: z.boolean().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateFormatInput = z.infer<typeof createFormatSchema>;
export type UpdateFormatInput = z.infer<typeof updateFormatSchema>;
export type CreateFlavorInput = z.infer<typeof createFlavorSchema>;
export type UpdateFlavorInput = z.infer<typeof updateFlavorSchema>;
