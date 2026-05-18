import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export type FormatUnit = 'g' | 'kg' | 'ml' | 'l' | 'cc' | 'oz';

export interface IFormat extends Document {
  _id: mongoose.Types.ObjectId;
  /** Etiqueta visible: "35g", "500ml", "1L". Auto-generada si no se provee. */
  label: string;
  /** Valor numérico, ej: 35 */
  value: number;
  /** Unidad: g, kg, ml, l, cc, oz */
  unit: FormatUnit;
  slug: string;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const formatSchema = new Schema<IFormat>(
  {
    label: {
      type: String,
      trim: true,
      required: false,
      maxlength: [40, 'La etiqueta no puede exceder 40 caracteres'],
    },
    value: {
      type: Number,
      required: [true, 'El valor numérico es requerido'],
      min: [0, 'El valor no puede ser negativo'],
    },
    unit: {
      type: String,
      required: [true, 'La unidad es requerida'],
      enum: ['g', 'kg', 'ml', 'l', 'cc', 'oz'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

formatSchema.index({ value: 1, unit: 1 }, { unique: true });
formatSchema.index({ active: 1 });

formatSchema.pre('save', function (next) {
  if (!this.label || this.isModified('value') || this.isModified('unit')) {
    const unitDisplay: Record<FormatUnit, string> = {
      g: 'g',
      kg: 'kg',
      ml: 'ml',
      l: 'L',
      cc: 'cc',
      oz: 'oz',
    };
    this.label = `${this.value}${unitDisplay[this.unit]}`;
  }
  if (this.isModified('label') || !this.slug) {
    this.slug = slugify(this.label, { lower: true, strict: true });
  }
  next();
});

export const Format = mongoose.model<IFormat>('Format', formatSchema);
export default Format;
