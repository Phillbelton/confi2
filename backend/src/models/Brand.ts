import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface IBrand extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Métodos de instancia
  hasProducts(): Promise<boolean>;
}

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la marca es requerido'],
      trim: true,
      unique: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
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
  }
);

// Índices (slug ya tiene unique:true inline)
brandSchema.index({ active: 1 });

// Middleware pre-save: Generar slug
brandSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'es',
    });
  }
  next();
});

// Método de instancia: Verificar si tiene productos
brandSchema.methods.hasProducts = async function (): Promise<boolean> {
  const ProductParent = mongoose.model('ProductParent');
  const count = await ProductParent.countDocuments({ brand: this._id, active: true });
  return count > 0;
};

export const Brand = mongoose.model<IBrand>('Brand', brandSchema);
