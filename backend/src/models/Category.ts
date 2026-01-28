import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  parent?: mongoose.Types.ObjectId;
  order: number;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Métodos de instancia
  hasSubcategories(): Promise<boolean>;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es requerido'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    image: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hex inválido'],
      default: '#F97316', // Naranja por defecto
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
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
categorySchema.index({ active: 1 });
categorySchema.index({ parent: 1, active: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ name: 1 });

// Middleware pre-save: Generar slug
categorySchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'es',
      remove: /[*+~.()'"!:@]/g,
    });

    // Asegurar unicidad
    const existingCategory = await mongoose.models.Category.findOne({
      slug: this.slug,
      _id: { $ne: this._id }
    });

    if (existingCategory) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Método estático: Obtener categorías principales (sin padre)
categorySchema.statics.getMainCategories = function () {
  return this.find({ parent: null, active: true }).sort({ order: 1, name: 1 });
};

// Método estático: Obtener subcategorías de una categoría
categorySchema.statics.getSubcategories = function (parentId: mongoose.Types.ObjectId) {
  return this.find({ parent: parentId, active: true }).sort({ order: 1, name: 1 });
};

// Método estático: Obtener todas las categorías activas
categorySchema.statics.getActiveCategories = function () {
  return this.find({ active: true }).sort({ order: 1, name: 1 });
};

// Método de instancia: Verificar si tiene subcategorías
categorySchema.methods.hasSubcategories = async function (): Promise<boolean> {
  const count = await mongoose.model('Category').countDocuments({ parent: this._id });
  return count > 0;
};

// Método de instancia: Verificar si tiene productos
categorySchema.methods.hasProducts = async function (): Promise<boolean> {
  const ProductParent = mongoose.model('ProductParent');
  const count = await ProductParent.countDocuments({
    categories: this._id,
    active: true
  });
  return count > 0;
};

// Validación: prevenir más de 2 niveles de anidamiento
categorySchema.pre('save', async function (next) {
  if (this.parent) {
    try {
      const parentCategory = await mongoose.models.Category.findById(this.parent);
      if (parentCategory && parentCategory.parent) {
        return next(
          new Error('No se permiten más de 2 niveles de categorías (categoría → subcategoría)')
        );
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);
