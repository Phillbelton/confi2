import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';
import { generateSimpleProductSKU, generateVariantSKU } from '../utils/skuGenerator';
import { normalizeVariantValue } from '../utils/normalizeVariantValue';

// Interfaces
export interface IFixedDiscount {
  enabled: boolean;
  type: 'percentage' | 'amount';
  value: number;
  startDate?: Date;
  endDate?: Date;
  badge?: string;
}

export interface ITieredDiscountVariant {
  tiers: {
    minQuantity: number;
    maxQuantity: number | null;
    type: 'percentage' | 'amount';
    value: number;
  }[];
  startDate?: Date;
  endDate?: Date;
  badge?: string;
  active: boolean;
}

export interface IProductVariant extends Document {
  _id: mongoose.Types.ObjectId;
  parentProduct: mongoose.Types.ObjectId;
  sku: string;
  attributes: { [key: string]: string };
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  trackStock: boolean;
  allowBackorder: boolean;
  lowStockThreshold: number;
  fixedDiscount?: IFixedDiscount;
  tieredDiscount?: ITieredDiscountVariant;
  active: boolean;
  order: number;
  views: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  inStock: boolean;
  lowStock: boolean;
  hasActiveDiscount: boolean;
  hasActiveTieredDiscount: boolean;
}

// NOTA IMPORTANTE: El campo 'slug' es required:false pero se genera automáticamente
// en el pre-save hook (línea 204). La validación estricta en el hook (línea 239)
// garantiza que nunca se guarde una variante sin slug.

// Schema
const productVariantSchema = new Schema<IProductVariant>(
  {
    parentProduct: {
      type: Schema.Types.ObjectId,
      ref: 'ProductParent',
      required: [true, 'La variante debe pertenecer a un producto padre'],
    },
    sku: {
      type: String,
      required: false, // Auto-generated in pre-save hook (see line 320)
      unique: true,
      uppercase: true,
      trim: true,
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    name: {
      type: String,
      required: false, // Auto-generated in pre-save hook (see line 211)
      trim: true,
    },
    slug: {
      type: String,
      required: false, // Auto-generated in pre-save hook (see line 207)
      unique: true,
      sparse: true, // Efficient indexing, allows null but prevents duplicates
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripción de la variante no puede exceder 1000 caracteres'],
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          // Permitir 0 imágenes o entre 1 y 5 imágenes
          return v.length === 0 || (v.length >= 1 && v.length <= 5);
        },
        message: 'La variante debe tener entre 0 y 5 imágenes',
      },
      default: [],
    },
    trackStock: {
      type: Boolean,
      default: true,
    },
    allowBackorder: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    fixedDiscount: {
      enabled: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ['percentage', 'amount'],
      },
      value: {
        type: Number,
        min: 0,
      },
      startDate: Date,
      endDate: Date,
      badge: String,
    },
    tieredDiscount: {
      tiers: [
        {
          minQuantity: {
            type: Number,
            required: true,
            min: 1,
          },
          maxQuantity: {
            type: Number,
            default: null,
          },
          type: {
            type: String,
            enum: ['percentage', 'amount'],
            required: true,
          },
          value: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      startDate: Date,
      endDate: Date,
      badge: String,
      active: {
        type: Boolean,
        default: true,
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
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
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices
productVariantSchema.index({ sku: 1 }, { unique: true });
productVariantSchema.index({ slug: 1 }, { unique: true, sparse: true });
productVariantSchema.index({ parentProduct: 1, active: 1 });
productVariantSchema.index({ price: 1 });
productVariantSchema.index({ stock: 1 });
productVariantSchema.index({ createdAt: -1 });
// Índices dinámicos por atributos comunes (se crearán en runtime si es necesario)
productVariantSchema.index({ 'attributes.tamaño': 1 });
productVariantSchema.index({ 'attributes.sabor': 1 });
productVariantSchema.index({ 'attributes.color': 1 });

// Índice compuesto para queries frecuentes
productVariantSchema.index({ parentProduct: 1, active: 1, stock: 1 });
productVariantSchema.index({ price: 1, active: 1 });

// Virtual: inStock
productVariantSchema.virtual('inStock').get(function () {
  return this.stock > 0 && this.active;
});

// Virtual: lowStock
productVariantSchema.virtual('lowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Virtual: hasActiveDiscount
productVariantSchema.virtual('hasActiveDiscount').get(function () {
  if (!this.fixedDiscount?.enabled) return false;

  const now = new Date();
  const startValid = !this.fixedDiscount.startDate || this.fixedDiscount.startDate <= now;
  const endValid = !this.fixedDiscount.endDate || this.fixedDiscount.endDate >= now;

  return startValid && endValid;
});

// Virtual: hasActiveTieredDiscount
productVariantSchema.virtual('hasActiveTieredDiscount').get(function () {
  if (!this.tieredDiscount?.active) return false;
  if (!this.tieredDiscount?.tiers || this.tieredDiscount.tiers.length === 0) return false;

  const now = new Date();
  const startValid = !this.tieredDiscount.startDate || this.tieredDiscount.startDate <= now;
  const endValid = !this.tieredDiscount.endDate || this.tieredDiscount.endDate >= now;

  return startValid && endValid;
});

// Virtual displayName: solo muestra los valores de los atributos (ej: "350ml Original")
productVariantSchema.virtual('displayName').get(function () {
  const attributesMap = this.attributes as any;
  if (attributesMap instanceof Map) {
    return Array.from(attributesMap.values()).join(' ') || 'Variante única';
  }
  // Fix: Check if attributes exists before calling Object.values()
  if (!this.attributes) {
    return 'Variante única';
  }
  return Object.values(this.attributes).join(' ') || 'Variante única';
});

// Pre-save: generar nombre y slug si no existen
productVariantSchema.pre('save', async function (next) {
  // Solo generar nombre automático si:
  // 1. No existe nombre (!this.name)
  // 2. O los attributes cambiaron pero el usuario no estableció un nombre manualmente
  const userSetName = this.isModified('name') && this.name;
  const shouldGenerateName = !this.name || (this.isModified('attributes') && !userSetName);

  if (shouldGenerateName) {
    try {
      // Obtener producto padre para construir el nombre
      const parent = await mongoose.models.ProductParent.findById(this.parentProduct);
      if (!parent) {
        return next(new Error('Producto padre no encontrado'));
      }

      // Construir nombre: "Bebida Cola 350ml Original"
      const attributesMap = this.attributes as any;
      let attributeValues = '';
      if (attributesMap instanceof Map) {
        attributeValues = Array.from(attributesMap.values()).join(' ');
      } else if (this.attributes) {
        attributeValues = Object.values(this.attributes).join(' ');
      }
      this.name = attributeValues ? `${parent.name} ${attributeValues}` : parent.name;
    } catch (error) {
      return next(error as Error);
    }
  }

  // Generar slug si no existe o si el nombre cambió
  if (!this.slug || this.isModified('name')) {
    try {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });

      // Asegurar unicidad del slug
      const existingVariant = await mongoose.models.ProductVariant.findOne({
        slug: this.slug,
        _id: { $ne: this._id }
      });

      if (existingVariant) {
        this.slug = `${this.slug}-${Date.now()}`;
      }

      // Validación estricta: garantizar que el slug SIEMPRE exista
      if (!this.slug) {
        return next(new Error('CRITICAL: No se pudo generar el slug para la variante'));
      }
    } catch (error) {
      return next(error as Error);
    }
  }

  // Validar que el nombre exista
  if (!this.name) {
    return next(new Error('CRITICAL: La variante debe tener un nombre'));
  }

  next();
});

// Pre-save: validar que attributes correspondan con variantAttributes del padre
productVariantSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('attributes') || this.isModified('parentProduct')) {
    try {
      const parent = await mongoose.models.ProductParent.findById(this.parentProduct);
      if (!parent) {
        return next(new Error('Producto padre no encontrado'));
      }

      // Si el padre no tiene variantAttributes, esta variante no debe tener atributos
      if (!parent.variantAttributes || parent.variantAttributes.length === 0) {
        const attributesMap = this.attributes as any;
        const attrKeys = attributesMap instanceof Map
          ? Array.from(attributesMap.keys())
          : Object.keys(this.attributes);
        if (attrKeys.length > 0) {
          return next(
            new Error('El producto padre no tiene atributos de variación definidos')
          );
        }
        return next();
      }

      // Validar que todos los atributos de la variante estén definidos en el padre
      const parentAttrNames = parent.variantAttributes.map((attr: any) => attr.name);
      const attributesMap = this.attributes as any;
      const variantAttrNames = attributesMap instanceof Map
        ? Array.from(attributesMap.keys())
        : Object.keys(this.attributes);

      for (const attrName of variantAttrNames) {
        if (!parentAttrNames.includes(attrName)) {
          return next(
            new Error(
              `El atributo "${attrName}" no está definido en el producto padre`
            )
          );
        }

        // Validar que el valor esté en los valores permitidos
        const parentAttr = parent.variantAttributes.find(
          (attr: any) => attr.name === attrName
        );
        const allowedValues = parentAttr.values.map((v: any) => v.value);
        const attributesMap = this.attributes as any;
        const variantValue = attributesMap instanceof Map
          ? attributesMap.get(attrName)
          : this.attributes[attrName];

        if (!allowedValues.includes(variantValue)) {
          return next(
            new Error(
              `El valor "${variantValue}" no es válido para el atributo "${attrName}". Valores permitidos: ${allowedValues.join(', ')}`
            )
          );
        }
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-save: normalizar valores de atributos para consistencia
productVariantSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('attributes')) {
    const attributesMap = this.attributes as any;

    if (attributesMap instanceof Map) {
      // Normalizar cada valor del Map
      const normalizedMap = new Map();
      for (const [key, value] of attributesMap.entries()) {
        normalizedMap.set(key, normalizeVariantValue(value));
      }
      this.attributes = normalizedMap as any;
    } else if (this.attributes) {
      // Normalizar cada valor del objeto
      const normalizedObj: Record<string, string> = {};
      for (const [key, value] of Object.entries(this.attributes)) {
        normalizedObj[key] = normalizeVariantValue(value);
      }
      this.attributes = normalizedObj as any;
    }
  }
  next();
});

// Pre-save: generar SKU si no existe
productVariantSchema.pre('save', async function (next) {
  if (!this.sku) {
    try {
      const parent = await mongoose.models.ProductParent.findById(this.parentProduct);
      if (!parent) {
        return next(new Error('Producto padre no encontrado'));
      }

      // Generar SKU descriptivo usando la nueva función
      const attributesMap = this.attributes as any;
      const attributesObj: Record<string, string> = attributesMap instanceof Map
        ? Object.fromEntries(attributesMap)
        : this.attributes;

      // Si tiene atributos, generar SKU con variantes
      // Si no tiene atributos, generar SKU simple
      if (Object.keys(attributesObj).length > 0) {
        this.sku = generateVariantSKU(parent.name, attributesObj);
      } else {
        this.sku = generateSimpleProductSKU(parent.name);
      }

      // Asegurar unicidad
      const existingSku = await mongoose.models.ProductVariant.findOne({
        sku: this.sku,
        _id: { $ne: this._id }
      });

      if (existingSku) {
        // Agregar timestamp corto para unicidad
        const timestamp = Date.now().toString().slice(-6);
        this.sku = `${this.sku}-${timestamp}`;
      }

      // Validación estricta: garantizar que el SKU SIEMPRE exista
      if (!this.sku) {
        return next(new Error('CRITICAL: No se pudo generar el SKU para la variante'));
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Validación: tiers de descuento deben ser coherentes
productVariantSchema.pre('save', function (next) {
  if (this.tieredDiscount?.active && this.tieredDiscount.tiers && this.tieredDiscount.tiers.length > 0) {
    const tiers = this.tieredDiscount.tiers;

    for (const tier of tiers) {
      // maxQuantity debe ser mayor que minQuantity
      if (tier.maxQuantity !== null && tier.maxQuantity < tier.minQuantity) {
        return next(
          new Error(
            `Tier inválido: maxQuantity (${tier.maxQuantity}) debe ser mayor que minQuantity (${tier.minQuantity})`
          )
        );
      }

      // minQuantity debe ser positivo
      if (tier.minQuantity < 1) {
        return next(new Error('minQuantity debe ser al menos 1'));
      }

      // Porcentajes no deben exceder 100%
      if (tier.type === 'percentage' && tier.value > 100) {
        return next(
          new Error(`Descuento porcentual no puede exceder 100% (actual: ${tier.value}%)`)
        );
      }

      // Porcentajes no deben ser negativos
      if (tier.type === 'percentage' && tier.value < 0) {
        return next(new Error('El descuento porcentual no puede ser negativo'));
      }

      // Valores de descuento fijo no deben ser negativos
      if (tier.type === 'amount' && tier.value < 0) {
        return next(new Error('El valor del descuento no puede ser negativo'));
      }

      // Descuento fijo no debe exceder el precio del producto
      if (tier.type === 'amount' && tier.value > this.price) {
        return next(
          new Error(
            `El descuento fijo ($${tier.value}) no puede ser mayor que el precio del producto ($${this.price})`
          )
        );
      }
    }

    // Detectar superposiciones (advertencia, no error)
    const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (current.maxQuantity !== null && current.maxQuantity >= next.minQuantity) {
        console.warn(
          `[ProductVariant ${this.sku}] Advertencia: Tiers superpuestos detectados entre ${current.minQuantity}-${current.maxQuantity} y ${next.minQuantity}-${next.maxQuantity || '∞'}`
        );
      }
    }
  }
  next();
});

// Validación: stock no puede ser negativo si allowBackorder = false
productVariantSchema.pre('save', function (next) {
  if (!this.allowBackorder && this.stock < 0) {
    return next(
      new Error('El stock no puede ser negativo cuando no se permite sobreventa')
    );
  }
  next();
});

const ProductVariant = mongoose.model<IProductVariant>(
  'ProductVariant',
  productVariantSchema
);

export default ProductVariant;
