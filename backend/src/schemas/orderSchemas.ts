import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para pedidos
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para dirección de envío
const shippingAddressSchema = z.object({
  street: z
    .string({
      required_error: 'La calle es requerida',
    })
    .trim(),

  number: z
    .string({
      required_error: 'El número es requerido',
    })
    .trim(),

  city: z
    .string({
      required_error: 'La ciudad es requerida',
    })
    .trim(),

  neighborhood: z.string().trim().optional(),

  reference: z.string().trim().optional(),
});

// Schema para item del pedido
const orderItemSchema = z.object({
  variant: objectIdSchema,
  quantity: z
    .number({
      required_error: 'La cantidad es requerida',
      invalid_type_error: 'La cantidad debe ser un número',
    })
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(999, 'La cantidad no puede exceder 999 unidades'),
});

// Schema para crear pedido
export const createOrderSchema = z.object({
  body: z.object({
    customer: z.object({
      name: z
        .string({
          required_error: 'El nombre del cliente es requerido',
        })
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .trim(),

      email: z
        .string({
          required_error: 'El email es requerido',
        })
        .email('Email inválido')
        .trim(),

      phone: z
        .string({
          required_error: 'El teléfono es requerido',
        })
        .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido'),

      address: shippingAddressSchema,
    }),

    items: z
      .array(orderItemSchema)
      .min(1, 'Debe incluir al menos un producto')
      .max(50, 'No puede exceder 50 productos'),

    deliveryMethod: z.enum(['delivery', 'pickup'], {
      errorMap: () => ({ message: 'Método de entrega inválido' }),
    }),

    paymentMethod: z.enum(['cash-on-delivery', 'transfer', 'card'], {
      errorMap: () => ({ message: 'Método de pago inválido' }),
    }),

    deliveryNotes: z
      .string()
      .max(500, 'Las notas no pueden exceder 500 caracteres')
      .trim()
      .optional(),

    customerNotes: z
      .string()
      .max(500, 'Las notas no pueden exceder 500 caracteres')
      .trim()
      .optional(),
  }),
});

// Schema para actualizar estado del pedido
export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(
      ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'],
      {
        errorMap: () => ({ message: 'Estado inválido' }),
      }
    ),

    adminNotes: z
      .string()
      .max(500, 'Las notas no pueden exceder 500 caracteres')
      .trim()
      .optional(),
  }),
});

// Schema para cancelar pedido
export const cancelOrderSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    cancellationReason: z
      .string({
        required_error: 'El motivo de cancelación es requerido',
      })
      .min(10, 'El motivo debe tener al menos 10 caracteres')
      .max(500, 'El motivo no puede exceder 500 caracteres')
      .trim(),
  }),
});

// Schema para agregar prueba de pago
export const addPaymentProofSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    paymentProof: z
      .string({
        required_error: 'La prueba de pago es requerida',
      })
      .url('URL de imagen inválida')
      .max(500, 'La URL no puede exceder 500 caracteres'),
  }),
});

// Schema para obtener pedido por ID
export const getOrderByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema para query params de listado
export const getOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: z
      .enum([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'delivering',
        'delivered',
        'cancelled',
      ])
      .optional(),
    deliveryMethod: z.enum(['delivery', 'pickup']).optional(),
    paymentMethod: z.enum(['cash-on-delivery', 'transfer', 'card']).optional(),
    customerId: objectIdSchema.optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    search: z.string().max(100).optional(), // Buscar por orderNumber, customer name, email
  }),
});

// Tipos TypeScript inferidos
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type AddPaymentProofInput = z.infer<typeof addPaymentProofSchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
export type GetOrdersQueryInput = z.infer<typeof getOrdersQuerySchema>;
