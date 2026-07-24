import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus, DeliveryMethod, PaymentMethod } from '../types';

// Interfaces
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  /**
   * Presentación comprada (subdoc `_id` dentro del producto). Junto con
   * `product` forma la identidad de la línea: el mismo producto puede
   * aparecer dos veces si se compró por unidad y por display.
   * Opcional: los pedidos anteriores a las presentaciones no lo tienen.
   */
  presentationId?: mongoose.Types.ObjectId;
  productSnapshot: {
    name: string;
    slug: string;
    barcode?: string;
    unitPrice: number;
    saleUnit: { type: string; quantity: number };
    image: string;
    /**
     * Escalera de precios vigente CUANDO SE HIZO EL PEDIDO. Se congela para
     * poder reeditar el pedido respetando lo pactado: si después sube el
     * precio de catálogo, el cliente no paga la diferencia, y si cambia la
     * cantidad sigue accediendo a los tramos por volumen que le correspondían.
     * (Si el precio BAJÓ, al recalcular se le pasa la rebaja: nunca se cobra
     * por encima de lo pactado, pero tampoco de más que el precio actual.)
     */
    tiers?: { minQuantity: number; pricePerUnit: number }[];
    fixedDiscount?: {
      enabled?: boolean;
      type?: string;
      value?: number;
      startDate?: Date;
      endDate?: Date;
    } | null;
  };
  quantity: number;
  pricePerUnit: number;
  discount: number;
  subtotal: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;

  // Cliente
  customer: {
    user?: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    phone: string;
    address?: {
      street: string;
      number: string;
      city: string;
      neighborhood?: string;
      reference?: string;
    };
  };

  // Notas de entrega (dirección alternativa, instrucciones especiales)
  deliveryNotes?: string;

  // Productos
  items: IOrderItem[];

  // Montos
  subtotal: number;
  totalDiscount: number;
  shippingCost: number;
  total: number;

  // Entrega y pago
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentProof?: string;

  // Estado
  status: OrderStatus;

  // WhatsApp tracking
  whatsappSent: boolean;
  whatsappSentAt?: Date;
  whatsappMessageId?: string;

  // Notas
  customerNotes?: string;
  adminNotes?: string;

  // Cancelación
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;

  // Auditoría
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
}

// Interface para métodos estáticos
export interface IOrderModel extends mongoose.Model<IOrder> {
  getStats(startDate?: Date, endDate?: Date): Promise<any>;
}

// Schema para items
const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Sin `ref`: es el _id de un subdocumento dentro del producto, no una colección.
    presentationId: {
      type: Schema.Types.ObjectId,
    },
    productSnapshot: {
      name: { type: String, required: true },
      slug: { type: String, required: true },
      barcode: { type: String },
      unitPrice: { type: Number, required: true, min: 0 },
      saleUnit: {
        type: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
      image: { type: String, default: '' },
      // Escalera congelada al momento de la compra (ver IOrderItem).
      tiers: [
        {
          _id: false,
          minQuantity: { type: Number, required: true, min: 1 },
          pricePerUnit: { type: Number, required: true, min: 0 },
        },
      ],
      fixedDiscount: {
        type: new Schema(
          {
            enabled: { type: Boolean },
            type: { type: String },
            value: { type: Number },
            startDate: { type: Date },
            endDate: { type: Date },
          },
          { _id: false }
        ),
        default: undefined,
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Schema principal
const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: false, // Auto-generated in pre-save hook
      unique: true,
      uppercase: true,
    },
    customer: {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
        required: [true, 'El nombre del cliente es requerido'],
        trim: true,
      },
      email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
      },
      phone: {
        type: String,
        required: [true, 'El teléfono del cliente es requerido'],
        trim: true,
      },
      address: {
        street: {
          type: String,
          trim: true,
        },
        number: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        neighborhood: {
          type: String,
          trim: true,
        },
        reference: {
          type: String,
          trim: true,
        },
      },
    },
    deliveryNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Las notas de entrega no pueden exceder 500 caracteres'],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v: IOrderItem[]) {
          return v && v.length > 0;
        },
        message: 'La orden debe tener al menos un producto',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryMethod: {
      type: String,
      enum: {
        values: ['pickup', 'delivery'],
        message: 'Método de entrega no válido',
      },
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'transfer'],
        message: 'Método de pago no válido',
      },
      required: true,
    },
    paymentProof: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending_whatsapp',
          'confirmed',
          'preparing',
          'shipped',
          'completed',
          'cancelled',
        ],
        message: 'Estado no válido',
      },
      default: 'pending_whatsapp',
      index: true,
    },
    whatsappSent: {
      type: Boolean,
      default: false,
    },
    whatsappSentAt: Date,
    whatsappMessageId: String,
    customerNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Las notas del cliente no pueden exceder 500 caracteres'],
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las notas del admin no pueden exceder 1000 caracteres'],
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: Date,
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'El motivo de cancelación no puede exceder 500 caracteres'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    confirmedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Índices
orderSchema.index({ 'customer.email': 1 });
// `GET /api/orders/my-orders` filtra por customer.user y ordena por
// createdAt DESC. Compuesto con el campo de sort al final → el explain()
// elige IXSCAN puro sin etapa SORT. Reemplaza al simple {customer.user: 1}
// que forzaba sort in-memory (33MB de límite, peligroso con power users).
orderSchema.index({ 'customer.user': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.user': 1, status: 1 });

// Pre-save: generar orderNumber único
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`;

      // Buscar el último número de orden del día
      const lastOrder = await mongoose.models.Order.findOne({
        orderNumber: new RegExp(`^QUE-${dateString}-`),
      })
        .sort({ orderNumber: -1 })
        .select('orderNumber');

      let sequence = 1;
      if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }

      this.orderNumber = `QUE-${dateString}-${String(sequence).padStart(3, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-save: actualizar timestamps según estado
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();

    switch (this.status) {
      case 'confirmed':
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case 'completed':
        if (!this.completedAt) this.completedAt = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
  next();
});

// Método estático: obtener estadísticas
orderSchema.statics.getStats = async function (startDate?: Date, endDate?: Date) {
  const match: any = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' },
      },
    },
  ]);

  return stats;
};

// Método estático: obtener órdenes por estado
orderSchema.statics.getByStatus = function (status: OrderStatus, limit = 50) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('customer.user', 'name email');
};

export const Order = mongoose.model<IOrder, IOrderModel>('Order', orderSchema);
