import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface IFlavor extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  /** Color hex opcional para UI (#FF5733). */
  color?: string;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const flavorSchema = new Schema<IFlavor>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del sabor es requerido'],
      trim: true,
      unique: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [60, 'El nombre no puede exceder 60 caracteres'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v),
        message: 'Color hex inválido',
      },
    },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

flavorSchema.index({ active: 1 });

flavorSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: 'es' });
  }
  next();
});

export const Flavor = mongoose.model<IFlavor>('Flavor', flavorSchema);
export default Flavor;
