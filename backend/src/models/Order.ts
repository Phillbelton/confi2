import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus, DeliveryMethod, PaymentMethod } from '../types';
import StockMovement from './StockMovement';

// Interfaces
export interface IOrderItem {
  variant: mongoose.Types.ObjectId;
  variantSnapshot: {
    sku: string;
    name: string;
    price: number;
    attributes: { [key: string]: string };
    image: string;
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
    email: string;
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
    variant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    variantSnapshot: {
      sku: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      attributes: {
        type: Map,
        of: String,
        default: {},
      },
      image: {
        type: String,
        default: '',
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
        required: [true, 'El email del cliente es requerido'],
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
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.user': 1 });
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

// Pre-save: descontar stock al crear orden
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const ProductVariant = mongoose.model('ProductVariant');

      // Validar stock disponible y descontar
      for (const item of this.items) {
        const variant = await ProductVariant.findById(item.variant);
        if (!variant) {
          return next(new Error(`Variante ${item.variantSnapshot.sku} no encontrada`));
        }

        // Verificar si hay stock suficiente (solo si trackStock = true)
        if (variant.trackStock && !variant.allowBackorder && variant.stock < item.quantity) {
          return next(
            new Error(
              `Stock insuficiente para ${variant.name}. Disponible: ${variant.stock}, Solicitado: ${item.quantity}`
            )
          );
        }

        // Crear movimiento de stock
        await StockMovement.createMovement(
          variant._id,
          'sale',
          -item.quantity,
          `Venta - Orden ${this.orderNumber}`,
          { orderId: this._id }
        );
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-save: restaurar stock al cancelar
orderSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === 'cancelled' && !this.isNew) {
    try {
      // Restaurar stock de cada item
      for (const item of this.items) {
        await StockMovement.createMovement(
          item.variant,
          'cancellation',
          item.quantity,
          `Cancelación - Orden ${this.orderNumber}`,
          {
            orderId: this._id,
            userId: this.cancelledBy,
            notes: this.cancellationReason,
          }
        );
      }

      // Establecer fecha de cancelación si no existe
      if (!this.cancelledAt) {
        this.cancelledAt = new Date();
      }
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
