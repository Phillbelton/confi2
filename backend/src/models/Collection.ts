import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface ICollection extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  emoji?: string;
  gradient?: string;
  products: mongoose.Types.ObjectId[];
  active: boolean;
  showOnHome: boolean;
  order: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la colección es requerido'],
      trim: true,
      unique: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [120, 'El nombre no puede exceder 120 caracteres'],
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
    emoji: {
      type: String,
      trim: true,
      maxlength: [8, 'Emoji inválido'],
    },
    gradient: {
      type: String,
      trim: true,
      maxlength: [120, 'Gradient inválido'],
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ProductParent',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    showOnHome: {
      type: Boolean,
      default: true,
    },
    order: {
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
  }
);

// Índices
collectionSchema.index({ active: 1, showOnHome: 1, order: 1 });
collectionSchema.index({ products: 1 });

// Middleware pre-save: Generar slug
collectionSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'es',
    });
  }
  next();
});

export const Collection = mongoose.model<ICollection>('Collection', collectionSchema);
export default Collection;
