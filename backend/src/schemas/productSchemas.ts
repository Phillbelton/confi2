import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para productos
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Helper para validar ObjectId opcional (acepta null, undefined, o string vacío)
const optionalObjectIdSchema = z
  .string()
  .nullish()
  .refine(
    (val) => {
      // Si es null, undefined, o string vacío, es válido (campo opcional)
      if (!val || val === '') return true;
      // Si tiene valor, debe ser un ObjectId válido
      return mongoose.Types.ObjectId.isValid(val);
    },
    {
      message: 'ID inválido',
    }
  );

// Helper para arrays opcionales de ObjectIds
const optionalObjectIdArraySchema = z
  .array(objectIdSchema)
  .nullish()
  .transform((val) => {
    // Si es null o undefined, retornar undefined (campo opcional)
    if (!val) return undefined;
    return val;
  });

// Schema para variant attributes (completo según el modelo)
const variantAttributeSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  order: z.number().int(),
  values: z.array(z.object({
    value: z.string(),
    displayValue: z.string(),
    order: z.number().int(),
  })),
});

// Schema para crear ProductParent
export const createProductParentSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres')
      .trim(),

    description: z
      .string({
        required_error: 'La descripción es requerida',
      })
      .max(5000, 'La descripción no puede exceder 5000 caracteres')
      .trim(),

    categories: z
      .array(objectIdSchema)
      .min(1, 'Debe seleccionar al menos una categoría'),

    brand: objectIdSchema.optional(),

    images: z.array(z.string()).optional(), // Acepta paths o URLs

    tags: z.array(objectIdSchema).optional(),

    seoTitle: z.string().max(200).optional(),

    seoDescription: z.string().max(500).optional(),

    variantAttributes: z.array(variantAttributeSchema).optional(),

    featured: z.boolean().optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para actualizar ProductParent
export const updateProductParentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres')
      .trim()
      .optional(),

    description: z
      .string()
      .max(5000, 'La descripción no puede exceder 5000 caracteres')
      .trim()
      .optional(),

    categories: optionalObjectIdArraySchema, // Acepta null, undefined, o array de IDs

    brand: optionalObjectIdSchema, // Acepta null, undefined, o string vacío

    images: z.array(z.string()).optional(), // Acepta paths o URLs

    tags: optionalObjectIdArraySchema, // Acepta null, undefined, o array de IDs

    seoTitle: z.string().max(200).optional(),

    seoDescription: z.string().max(500).optional(),

    variantAttributes: z.array(variantAttributeSchema).optional(),

    featured: z.boolean().optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para fixedDiscount
const fixedDiscountSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(['percentage', 'amount']),
  value: z.number().positive(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  badge: z.string().optional(),
});

// Schema para tieredDiscount en ProductVariant (sin attribute/attributeValue)
const tieredDiscountVariantSchema = z.object({
  tiers: z.array(z.object({
    minQuantity: z.number().int().positive(),
    maxQuantity: z.number().int().positive().nullable(),
    type: z.enum(['percentage', 'amount']),
    value: z.number().positive(),
  })),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  badge: z.string().optional(),
  active: z.boolean(),
}).refine(
  (data) => {
    // Si active es true, debe tener al menos un tier
    if (data.active && data.tiers.length === 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe tener al menos un nivel de descuento cuando está activo',
    path: ['tiers'],
  }
);

// Schema para atributos de variante (Map de string -> string)
const attributesSchema = z.record(z.string()).optional();

// Schema para crear ProductVariant (según modelo real)
export const createProductVariantSchema = z.object({
  body: z.object({
    parentProduct: objectIdSchema,

    sku: z
      .string()
      .min(3, 'El SKU debe tener al menos 3 caracteres')
      .max(50, 'El SKU no puede exceder 50 caracteres')
      .trim()
      .toUpperCase()
      .optional(), // El SKU es opcional porque se autogenera en el modelo

    attributes: attributesSchema,

    name: z.string().optional(), // Opcional, si no se proporciona se autogenera

    description: z.string().max(1000).optional(),

    price: z
      .number({
        required_error: 'El precio es requerido',
        invalid_type_error: 'El precio debe ser un número',
      })
      .min(0, 'El precio no puede ser negativo'),

    stock: z
      .number({
        invalid_type_error: 'El stock debe ser un número',
      })
      .int('El stock debe ser un número entero')
      .min(0, 'El stock no puede ser negativo')
      .default(0),

    images: z
      .array(z.string())
      .max(5, 'No puede tener más de 5 imágenes')
      .optional(), // 0 imágenes es válido según el modelo, acepta paths o URLs

    trackStock: z.boolean().optional(),

    allowBackorder: z.boolean().optional(),

    lowStockThreshold: z.number().int().positive().optional(),

    fixedDiscount: fixedDiscountSchema.optional(),

    tieredDiscount: tieredDiscountVariantSchema.optional(),

    order: z.number().int().optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para actualizar ProductVariant
export const updateProductVariantSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    sku: z
      .string()
      .min(3, 'El SKU debe tener al menos 3 caracteres')
      .max(50, 'El SKU no puede exceder 50 caracteres')
      .trim()
      .toUpperCase()
      .optional(),

    attributes: attributesSchema,

    name: z.string().optional(),

    description: z.string().max(1000).optional(),

    price: z
      .number()
      .min(0, 'El precio no puede ser negativo')
      .optional(),

    stock: z
      .number()
      .int('El stock debe ser un número entero')
      .min(0, 'El stock no puede ser negativo')
      .optional(),

    images: z
      .array(z.string())
      .max(5, 'No puede tener más de 5 imágenes')
      .optional(), // Acepta paths o URLs

    trackStock: z.boolean().optional(),

    allowBackorder: z.boolean().optional(),

    lowStockThreshold: z.number().int().positive().optional(),

    fixedDiscount: fixedDiscountSchema.optional(),

    tieredDiscount: tieredDiscountVariantSchema.optional(),

    order: z.number().int().optional(),

    active: z.boolean().optional(),
  }),
});

// Schema para actualizar stock
export const updateStockSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    stock: z
      .number({
        required_error: 'El stock es requerido',
        invalid_type_error: 'El stock debe ser un número',
      })
      .int('El stock debe ser un número entero')
      .min(0, 'El stock no puede ser negativo'),
  }),
});

// Schema para obtener producto por ID
export const getProductByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para query params de listado
export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    category: objectIdSchema.optional(),
    brand: objectIdSchema.optional(),
    tags: z.string().optional(), // Comma-separated IDs
    minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    inStock: z.enum(['true', 'false']).optional(),
    active: z.enum(['true', 'false']).optional(),
    search: z.string().max(100).optional(),
    sort: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest']).optional(),
  }),
});

// Schema para obtener producto por slug
export const getProductBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'El slug no puede estar vacío'),
  }),
});

// Schema para eliminar producto
export const deleteProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para obtener variantes de un parent
export const getProductVariantsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    active: z.enum(['true', 'false']).optional(),
  }),
});

// Schema para productos destacados
export const getFeaturedProductsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

// Schema para obtener variante por SKU
export const getVariantBySkuSchema = z.object({
  params: z.object({
    sku: z.string().min(1, 'El SKU no puede estar vacío'),
  }),
});

// Schema para discount preview
export const getDiscountPreviewSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    quantity: z.string().regex(/^\d+$/).optional(),
  }),
});

// Schema para obtener variantes con stock bajo/sin stock
export const getStockVariantsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

// Tipos TypeScript inferidos
export type CreateProductParentInput = z.infer<typeof createProductParentSchema>;
export type UpdateProductParentInput = z.infer<typeof updateProductParentSchema>;
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type GetProductByIdInput = z.infer<typeof getProductByIdSchema>;
export type GetProductBySlugInput = z.infer<typeof getProductBySlugSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
export type GetProductVariantsInput = z.infer<typeof getProductVariantsSchema>;
export type GetFeaturedProductsInput = z.infer<typeof getFeaturedProductsSchema>;
export type GetProductsQueryInput = z.infer<typeof getProductsQuerySchema>;
export type GetVariantBySkuInput = z.infer<typeof getVariantBySkuSchema>;
export type GetDiscountPreviewInput = z.infer<typeof getDiscountPreviewSchema>;
export type GetStockVariantsInput = z.infer<typeof getStockVariantsSchema>;
