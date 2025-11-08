import mongoose, { Document, Schema } from 'mongoose';

// Types
export type StockMovementType = 'sale' | 'cancellation' | 'adjustment' | 'return' | 'restock';

// Interface
export interface IStockMovement extends Document {
  _id: mongoose.Types.ObjectId;
  variant: mongoose.Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  order?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  reason: string;
  notes?: string;
  createdAt: Date;
}

// Interface para métodos estáticos
export interface IStockMovementModel extends mongoose.Model<IStockMovement> {
  createMovement(
    variantId: mongoose.Types.ObjectId,
    type: StockMovementType,
    quantity: number,
    reason: string,
    options?: {
      orderId?: mongoose.Types.ObjectId;
      userId?: mongoose.Types.ObjectId;
      notes?: string;
    }
  ): Promise<IStockMovement>;

  getVariantHistory(
    variantId: mongoose.Types.ObjectId,
    limit?: number
  ): Promise<IStockMovement[]>;

  getOrderMovements(
    orderId: mongoose.Types.ObjectId
  ): Promise<IStockMovement[]>;
}

// Schema
const stockMovementSchema = new Schema<IStockMovement>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: [true, 'La variante es requerida'],
    },
    type: {
      type: String,
      enum: {
        values: ['sale', 'cancellation', 'adjustment', 'return', 'restock'],
        message: 'Tipo de movimiento no válido',
      },
      required: [true, 'El tipo de movimiento es requerido'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es requerida'],
      validate: {
        validator: function (v: number) {
          return v !== 0;
        },
        message: 'La cantidad no puede ser cero',
      },
    },
    previousStock: {
      type: Number,
      required: [true, 'El stock previo es requerido'],
    },
    newStock: {
      type: Number,
      required: [true, 'El stock nuevo es requerido'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: [true, 'El motivo del cambio es requerido'],
      trim: true,
      maxlength: [200, 'El motivo no puede exceder 200 caracteres'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Índices
stockMovementSchema.index({ variant: 1, createdAt: -1 });
stockMovementSchema.index({ order: 1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ variant: 1, type: 1, createdAt: -1 });

// Método estático: crear movimiento de stock
stockMovementSchema.statics.createMovement = async function (
  variantId: mongoose.Types.ObjectId,
  type: StockMovementType,
  quantity: number,
  reason: string,
  options?: {
    orderId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    notes?: string;
  }
) {
  const variant = await mongoose.models.ProductVariant.findById(variantId);
  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  const previousStock = variant.stock;
  const newStock = previousStock + quantity;

  const movement = await this.create({
    variant: variantId,
    type,
    quantity,
    previousStock,
    newStock,
    order: options?.orderId,
    user: options?.userId,
    reason,
    notes: options?.notes,
  });

  // Actualizar stock de la variante
  variant.stock = newStock;
  await variant.save();

  return movement;
};

// Método estático: obtener historial de una variante
stockMovementSchema.statics.getVariantHistory = async function (
  variantId: mongoose.Types.ObjectId,
  limit = 50
) {
  return this.find({ variant: variantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('order', 'orderNumber status')
    .populate('user', 'name email');
};

// Método estático: obtener movimientos por orden
stockMovementSchema.statics.getOrderMovements = async function (
  orderId: mongoose.Types.ObjectId
) {
  return this.find({ order: orderId })
    .sort({ createdAt: -1 })
    .populate('variant', 'sku name');
};

const StockMovement = mongoose.model<IStockMovement, IStockMovementModel>('StockMovement', stockMovementSchema);

export default StockMovement;
