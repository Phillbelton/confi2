import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

// Interfaces
export interface IVariantAttribute {
  name: string;
  displayName: string;
  order: number;
  values: {
    value: string;
    displayValue: string;
    order: number;
  }[];
}

export interface IProductParent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  categories: mongoose.Types.ObjectId[];
  brand?: mongoose.Types.ObjectId;
  images?: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  variantAttributes: IVariantAttribute[];
  featured: boolean;
  active: boolean;
  views: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  hasVariants: boolean;
}

// Schema
const productParentSchema = new Schema<IProductParent>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [200, 'El nombre no puede exceder 200 caracteres'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
      maxlength: [5000, 'La descripción no puede exceder 5000 caracteres'],
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      required: [true, 'El producto debe tener al menos una categoría'],
      validate: {
        validator: function (v: mongoose.Types.ObjectId[]) {
          return v && v.length > 0;
        },
        message: 'El producto debe tener al menos una categoría',
      },
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 5;
        },
        message: 'El producto padre puede tener máximo 5 imágenes',
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'El producto puede tener máximo 10 tags',
      },
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'El título SEO no puede exceder 70 caracteres'],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'La descripción SEO no puede exceder 160 caracteres'],
    },
    variantAttributes: [
      {
        name: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        displayName: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        values: [
          {
            value: {
              type: String,
              required: true,
              trim: true,
            },
            displayValue: {
              type: String,
              required: true,
            },
            order: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
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

// Índices (slug ya tiene unique:true inline)
productParentSchema.index({ categories: 1, active: 1 });
productParentSchema.index({ brand: 1, active: 1 });
productParentSchema.index({ featured: 1, active: 1 });
productParentSchema.index({ name: 'text', description: 'text' });
productParentSchema.index({ createdAt: -1 });

// Virtual: hasVariants
productParentSchema.virtual('hasVariants').get(function () {
  return this.variantAttributes && this.variantAttributes.length > 0;
});

// Pre-save: generar slug
productParentSchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Asegurar unicidad
    const existingProduct = await mongoose.models.ProductParent.findOne({
      slug: this.slug,
      _id: { $ne: this._id }
    });

    if (existingProduct) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Validación: variantAttributes debe tener al menos 2 valores si existe
productParentSchema.pre('save', function (next) {
  if (this.variantAttributes && this.variantAttributes.length > 0) {
    for (const attr of this.variantAttributes) {
      if (!attr.values || attr.values.length < 2) {
        return next(
          new Error(
            `El atributo "${attr.displayName}" debe tener al menos 2 valores para considerarse variante`
          )
        );
      }
    }
  }
  next();
});

const ProductParent = mongoose.model<IProductParent>('ProductParent', productParentSchema);

export default ProductParent;
