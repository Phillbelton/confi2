import { z } from 'zod';

/**
 * Schema de validación para órdenes
 */

// Schema de item de orden
export const orderItemSchema = z.object({
  variantId: z.string()
    .length(24, 'ID de MongoDB debe tener 24 caracteres'),

  quantity: z.number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(100, 'Cantidad máxima: 100 unidades')
});

// Schema para crear orden
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema)
    .min(1, 'La orden debe tener al menos 1 producto')
    .max(50, 'Máximo 50 productos por orden'),

  deliveryMethod: z.enum(['pickup', 'delivery'], {
    message: 'Método debe ser "pickup" o "delivery"'
  }),

  paymentMethod: z.enum(['cash', 'transfer'], {
    message: 'Método de pago debe ser "cash" o "transfer"'
  }),

  // ID de dirección guardada a usar (opcional)
  useAddressId: z.string()
    .length(24, 'ID de dirección inválido')
    .optional(),

  // Notas especiales de entrega (opcional)
  deliveryNotes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional(),

  // Notas del cliente (opcional)
  customerNotes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional()
});

// Schema para confirmar orden (funcionario)
export const confirmOrderSchema = z.object({
  params: z.object({
    id: z.string()
      .length(24, 'ID de MongoDB debe tener 24 caracteres')
  }),

  body: z.object({
    shippingCost: z.number()
      .nonnegative('El costo no puede ser negativo')
      .max(1000000, 'Costo máximo: 1.000.000 Gs'),

    adminNotes: z.string()
      .max(1000, 'Las notas no pueden exceder 1000 caracteres')
      .trim()
      .optional()
  })
});

// Schema para actualizar estado
export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string()
      .length(24, 'ID de MongoDB debe tener 24 caracteres')
  }),

  body: z.object({
    status: z.enum([
      'pending_whatsapp',
      'confirmed',
      'preparing',
      'shipped',
      'completed',
      'cancelled'
    ]),

    adminNotes: z.string()
      .max(1000)
      .trim()
      .optional()
  })
});

// Schema para cancelar orden
export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string()
      .length(24, 'ID de MongoDB debe tener 24 caracteres')
  }),

  body: z.object({
    reason: z.string()
      .min(10, 'El motivo debe tener al menos 10 caracteres')
      .max(500, 'El motivo no puede exceder 500 caracteres')
      .trim()
  })
});

// Schema para obtener órdenes (query params)
export const getOrdersQuerySchema = z.object({
  query: z.object({
    status: z.enum([
      'pending_whatsapp',
      'confirmed',
      'preparing',
      'shipped',
      'completed',
      'cancelled'
    ]).optional(),

    page: z.string()
      .regex(/^\d+$/, 'Página debe ser un número')
      .optional(),

    limit: z.string()
      .regex(/^\d+$/, 'Límite debe ser un número')
      .optional(),

    email: z.string()
      .email('Email inválido')
      .optional(),

    orderNumber: z.string()
      .max(50, 'Número de orden muy largo')
      .optional(),

    startDate: z.string()
      .datetime('Fecha de inicio inválida')
      .optional(),

    endDate: z.string()
      .datetime('Fecha de fin inválida')
      .optional()
  })
});

// Schema para obtener orden por ID
export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string()
      .length(24, 'ID de MongoDB debe tener 24 caracteres')
  })
});

// Schema para obtener orden por número
export const getOrderByNumberSchema = z.object({
  params: z.object({
    orderNumber: z.string()
      .min(1, 'Número de orden requerido')
      .max(50, 'Número de orden muy largo')
  })
});

// Schema para obtener mis órdenes (query params)
export const getMyOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Página debe ser un número')
      .optional(),

    limit: z.string()
      .regex(/^\d+$/, 'Límite debe ser un número')
      .optional()
  })
});

// Schema para marcar WhatsApp como enviado
export const markWhatsAppSentSchema = z.object({
  params: z.object({
    id: z.string()
      .length(24, 'ID de MongoDB debe tener 24 caracteres')
  }),

  body: z.object({
    messageId: z.string()
      .max(200, 'ID de mensaje muy largo')
      .optional()
  })
});

// Schema para obtener estadísticas
export const getOrderStatsQuerySchema = z.object({
  query: z.object({
    startDate: z.string()
      .datetime('Fecha de inicio inválida')
      .optional(),

    endDate: z.string()
      .datetime('Fecha de fin inválida')
      .optional()
  })
});

// Tipos inferidos
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type GetOrdersQueryInput = z.infer<typeof getOrdersQuerySchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
export type GetOrderByNumberInput = z.infer<typeof getOrderByNumberSchema>;
export type GetMyOrdersQueryInput = z.infer<typeof getMyOrdersQuerySchema>;
export type MarkWhatsAppSentInput = z.infer<typeof markWhatsAppSentSchema>;
export type GetOrderStatsQueryInput = z.infer<typeof getOrderStatsQuerySchema>;
