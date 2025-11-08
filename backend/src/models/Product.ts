import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';
import { ProductDiscount } from '../types';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  images: string[];
  featured: boolean;
  active: boolean;
  discount?: ProductDiscount;
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  calculateDiscount(quantity: number): {
    hasDiscount: boolean;
    originalPrice: number;
    discountedPrice: number;
    discountAmount: number;
    discountPercentage: number;
    badge?: string;
  };
  isDiscountActive(): boolean;
}

const tieredDiscountTierSchema = new Schema(
  {
    minQuantity: {
      type: Number,
      required: true,
      min: [1, 'La cantidad mínima debe ser al menos 1'],
    },
    maxQuantity: {
      type: Number,
      default: null,
      min: [1, 'La cantidad máxima debe ser al menos 1'],
    },
    type: {
      type: String,
      enum: ['percentage', 'amount'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: [0, 'El valor del descuento no puede ser negativo'],
    },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [200, 'El nombre no puede exceder 200 caracteres'],
      index: 'text',
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
      minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
      maxlength: [2000, 'La descripción no puede exceder 2000 caracteres'],
      index: 'text',
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: [0, 'El precio no puede ser negativo'],
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'El stock es requerido'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es requerida'],
      index: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      index: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v && v.length >= 1 && v.length <= 5;
        },
        message: 'Debe haber entre 1 y 5 imágenes',
      },
      required: [true, 'Al menos una imagen es requerida'],
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    discount: {
      fixed: {
        enabled: { type: Boolean, default: false },
        type: {
          type: String,
          enum: ['percentage', 'amount'],
        },
        value: {
          type: Number,
          min: [0, 'El valor del descuento no puede ser negativo'],
        },
        startDate: Date,
        endDate: Date,
        badge: String,
      },
      tiered: {
        enabled: { type: Boolean, default: false },
        tiers: [tieredDiscountTierSchema],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices compuestos
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ brand: 1, active: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ featured: 1, active: 1 });
productSchema.index({ createdAt: -1 });

// Middleware pre-save: Generar slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'es',
    });
  }
  next();
});

// Método: Verificar si el descuento fijo está activo
productSchema.methods.isDiscountActive = function (): boolean {
  if (!this.discount?.fixed?.enabled) return false;

  const now = new Date();
  const { startDate, endDate } = this.discount.fixed;

  if (startDate && now < new Date(startDate)) return false;
  if (endDate && now > new Date(endDate)) return false;

  return true;
};

// Método: Calcular descuento según cantidad
productSchema.methods.calculateDiscount = function (quantity: number = 1) {
  const result = {
    hasDiscount: false,
    originalPrice: this.price,
    discountedPrice: this.price,
    discountAmount: 0,
    discountPercentage: 0,
    badge: undefined as string | undefined,
  };

  let bestDiscount = 0;
  let bestBadge: string | undefined;

  // 1. Verificar descuento fijo
  if (this.isDiscountActive()) {
    const { type, value, badge } = this.discount.fixed;

    if (type === 'percentage') {
      bestDiscount = (this.price * value) / 100;
      bestBadge = badge || `${value}% OFF`;
    } else if (type === 'amount') {
      bestDiscount = value;
      bestBadge = badge || `$${value} OFF`;
    }
  }

  // 2. Verificar descuento escalonado
  if (this.discount?.tiered?.enabled && this.discount.tiered.tiers.length > 0) {
    // Encontrar el tier que aplica
    const applicableTier = this.discount.tiered.tiers.find((tier: any) => {
      const inMinRange = quantity >= tier.minQuantity;
      const inMaxRange = tier.maxQuantity === null || quantity <= tier.maxQuantity;
      return inMinRange && inMaxRange;
    });

    if (applicableTier) {
      let tieredDiscount = 0;

      if (applicableTier.type === 'percentage') {
        tieredDiscount = (this.price * applicableTier.value) / 100;
      } else if (applicableTier.type === 'amount') {
        tieredDiscount = applicableTier.value;
      }

      // Aplicar el mejor descuento (el mayor)
      if (tieredDiscount > bestDiscount) {
        bestDiscount = tieredDiscount;
        bestBadge = `${quantity}+ unidades`;
      }
    }
  }

  // 3. Aplicar descuento si existe
  if (bestDiscount > 0) {
    result.hasDiscount = true;
    result.discountAmount = bestDiscount;
    result.discountedPrice = Math.max(0, this.price - bestDiscount);
    result.discountPercentage = (bestDiscount / this.price) * 100;
    result.badge = bestBadge;
  }

  return result;
};

// Virtual: Verificar si está en stock
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Virtual: Verificar si el stock es bajo
productSchema.virtual('lowStock').get(function () {
  return this.stock > 0 && this.stock <= 5;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
