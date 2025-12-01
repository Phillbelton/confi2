import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

// Interface
export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  active: boolean;
  order: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para métodos estáticos
export interface ITagModel extends mongoose.Model<ITag> {
  getActiveTags(): Promise<ITag[]>;
  getOrCreate(name: string): Promise<ITag>;
}

// Schema
const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del tag es requerido'],
      unique: true,
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [30, 'El nombre no puede exceder 30 caracteres'],
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
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hex inválido'],
      default: '#10B981', // Verde por defecto
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
    },
    active: {
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
tagSchema.index({ slug: 1 }, { unique: true });
tagSchema.index({ active: 1 });
tagSchema.index({ order: 1 });
tagSchema.index({ name: 1 });

// Pre-save: generar slug
tagSchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Asegurar unicidad
    const existingTag = await mongoose.models.Tag.findOne({
      slug: this.slug,
      _id: { $ne: this._id }
    });

    if (existingTag) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Método estático: Obtener tags activos
tagSchema.statics.getActiveTags = function () {
  return this.find({ active: true }).sort({ order: 1, name: 1 });
};

// Método estático: Obtener o crear tag (con manejo de race conditions)
tagSchema.statics.getOrCreate = async function (name: string) {
  try {
    // Usar findOneAndUpdate con upsert para operación atómica
    const tag = await this.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
      { $setOnInsert: { name: name.trim(), active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return tag;
  } catch (error: any) {
    // Si hay error de duplicado (race condition), intentar de nuevo
    if (error.code === 11000) {
      return await this.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    }
    throw error;
  }
};

export const Tag = mongoose.model<ITag, ITagModel>('Tag', tagSchema);

// Tags predefinidos para seed inicial
export const PREDEFINED_TAGS = [
  { name: 'sin gluten', color: '#10B981', description: 'Producto apto para celíacos', order: 1 },
  { name: 'vegano', color: '#22C55E', description: 'Producto sin ingredientes de origen animal', order: 2 },
  { name: 'sin azúcar', color: '#3B82F6', description: 'Producto sin azúcar añadida', order: 3 },
  { name: 'importado', color: '#6366F1', description: 'Producto importado', order: 4 },
  { name: 'nuevo', color: '#F59E0B', description: 'Producto recién agregado', order: 5 },
  { name: 'oferta', color: '#EF4444', description: 'Producto en oferta', order: 6 },
  { name: 'descuento', color: '#DC2626', description: 'Producto con descuento', order: 7 },
  { name: 'orgánico', color: '#84CC16', description: 'Producto orgánico certificado', order: 8 },
  { name: 'sin lactosa', color: '#06B6D4', description: 'Producto sin lactosa', order: 9 },
  { name: 'light', color: '#8B5CF6', description: 'Versión reducida en calorías', order: 10 },
];
