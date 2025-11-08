import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para movimientos de stock
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para ajuste manual de stock
export const adjustStockSchema = z.object({
  body: z.object({
    variant: objectIdSchema,

    quantity: z
      .number({
        required_error: 'La cantidad es requerida',
        invalid_type_error: 'La cantidad debe ser un número',
      })
      .int('La cantidad debe ser un número entero')
      .refine((val) => val !== 0, {
        message: 'La cantidad no puede ser cero',
      }),

    reason: z
      .string({
        required_error: 'El motivo es requerido',
      })
      .min(5, 'El motivo debe tener al menos 5 caracteres')
      .max(500, 'El motivo no puede exceder 500 caracteres')
      .trim(),

    notes: z
      .string()
      .max(1000, 'Las notas no pueden exceder 1000 caracteres')
      .trim()
      .optional(),
  }),
});

// Schema para restock de producto
export const restockSchema = z.object({
  body: z.object({
    variant: objectIdSchema,

    quantity: z
      .number({
        required_error: 'La cantidad es requerida',
        invalid_type_error: 'La cantidad debe ser un número',
      })
      .int('La cantidad debe ser un número entero')
      .positive('La cantidad debe ser positiva'),

    cost: z
      .number()
      .positive('El costo debe ser positivo')
      .optional(),

    supplier: z
      .string()
      .max(200, 'El nombre del proveedor no puede exceder 200 caracteres')
      .trim()
      .optional(),

    invoiceNumber: z
      .string()
      .max(100, 'El número de factura no puede exceder 100 caracteres')
      .trim()
      .optional(),

    notes: z
      .string()
      .max(1000, 'Las notas no pueden exceder 1000 caracteres')
      .trim()
      .optional(),
  }),
});

// Schema para obtener movimientos de una variante
export const getVariantMovementsSchema = z.object({
  params: z.object({
    variantId: objectIdSchema,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),

    type: z
      .enum(['sale', 'restock', 'adjustment', 'return', 'damage'])
      .optional(),

    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

// Schema para obtener movimientos de un pedido
export const getOrderMovementsSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});

// Schema para obtener todos los movimientos (query general)
export const getMovementsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),

    type: z
      .enum(['sale', 'restock', 'adjustment', 'return', 'damage'])
      .optional(),

    variant: objectIdSchema.optional(),

    order: objectIdSchema.optional(),

    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

    minQuantity: z.string().regex(/^-?\d+$/).optional(), // Permite negativos

    sort: z
      .enum(['date_asc', 'date_desc', 'quantity_asc', 'quantity_desc'])
      .optional()
      .default('date_desc'),
  }),
});

// Tipos TypeScript inferidos
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type RestockInput = z.infer<typeof restockSchema>;
export type GetVariantMovementsInput = z.infer<typeof getVariantMovementsSchema>;
export type GetOrderMovementsInput = z.infer<typeof getOrderMovementsSchema>;
export type GetMovementsQueryInput = z.infer<typeof getMovementsQuerySchema>;
