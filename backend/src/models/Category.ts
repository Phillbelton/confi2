import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface IFacetableAttributeOption {
  value: string;
  label: string;
}

export interface IFacetableAttribute {
  key: string;
  label: string;
  options: IFacetableAttributeOption[];
  multiSelect: boolean;
  order: number;
}

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
  facetableAttributes: IFacetableAttribute[];
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Métodos de instancia
  hasSubcategories(): Promise<boolean>;
}

const SLUG_RE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const facetableOptionSchema = new Schema<IFacetableAttributeOption>(
  {
    value: { type: String, required: true, trim: true, maxlength: 60 },
    label: { type: String, required: true, trim: true, maxlength: 80 },
  },
  { _id: false }
);

const facetableAttributeSchema = new Schema<IFacetableAttribute>(
  {
    key: { type: String, required: true, trim: true, maxlength: 60 },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    options: { type: [facetableOptionSchema], default: [] },
    multiSelect: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

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
    facetableAttributes: {
      type: [facetableAttributeSchema],
      default: [],
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

// Validación: prevenir más de 3 niveles de anidamiento (L1 → L2 → L3)
categorySchema.pre('save', async function (next) {
  if (this.parent) {
    try {
      const parentCategory = await mongoose.models.Category.findById(this.parent);
      if (parentCategory && parentCategory.parent) {
        // El padre ya tiene padre → este sería L3. OK.
        const grandparent = await mongoose.models.Category.findById(parentCategory.parent);
        if (grandparent && grandparent.parent) {
          return next(
            new Error('Máximo 3 niveles de categorías permitidos (raíz → L2 → L3)')
          );
        }
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

/**
 * Helper estático: devuelve los _id de la categoría dada y TODOS sus descendientes
 * (BFS recursivo). Útil para filtrar productos: "muestra todo lo que esté
 * dentro de esta categoría y sus sub-niveles".
 */
categorySchema.statics.getDescendantIds = async function (
  categoryId: mongoose.Types.ObjectId | string
): Promise<mongoose.Types.ObjectId[]> {
  const rootId = typeof categoryId === 'string'
    ? new mongoose.Types.ObjectId(categoryId)
    : categoryId;
  const result: mongoose.Types.ObjectId[] = [rootId];
  const queue: mongoose.Types.ObjectId[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = await this.find({ parent: current, active: true })
      .select('_id')
      .lean();
    for (const c of children) {
      result.push(c._id as mongoose.Types.ObjectId);
      queue.push(c._id as mongoose.Types.ObjectId);
    }
  }
  return result;
};

// Validación pre-save: keys/values con formato slug y únicos
categorySchema.pre('save', function (next) {
  const arr = this.facetableAttributes || [];
  const seenKeys = new Set<string>();
  for (const attr of arr) {
    if (!SLUG_RE.test(attr.key)) {
      return next(new Error(`facetableAttributes: key "${attr.key}" no es slug válido`));
    }
    if (seenKeys.has(attr.key)) {
      return next(new Error(`facetableAttributes: key "${attr.key}" duplicada`));
    }
    seenKeys.add(attr.key);
    const seenValues = new Set<string>();
    for (const opt of attr.options || []) {
      if (!SLUG_RE.test(opt.value)) {
        return next(
          new Error(`facetableAttributes[${attr.key}]: option value "${opt.value}" no es slug válido`)
        );
      }
      if (seenValues.has(opt.value)) {
        return next(
          new Error(`facetableAttributes[${attr.key}]: option value "${opt.value}" duplicada`)
        );
      }
      seenValues.add(opt.value);
    }
  }
  next();
});

/**
 * Helper estático: devuelve los _id de la categoría dada y todos sus ancestros
 * subiendo por `parent` hasta la raíz. Útil para herencia acumulativa de
 * `facetableAttributes` (un producto en L3 hereda de L2 y L1).
 */
categorySchema.statics.getAncestorIds = async function (
  categoryId: mongoose.Types.ObjectId | string
): Promise<mongoose.Types.ObjectId[]> {
  const startId =
    typeof categoryId === 'string' ? new mongoose.Types.ObjectId(categoryId) : categoryId;
  const result: mongoose.Types.ObjectId[] = [];
  let current: mongoose.Types.ObjectId | null = startId;
  const visited = new Set<string>();
  while (current) {
    const key = current.toString();
    if (visited.has(key)) break;
    visited.add(key);
    const doc: any = await this.findById(current).select('_id parent').lean();
    if (!doc) break;
    result.push(doc._id as mongoose.Types.ObjectId);
    current = (doc.parent as mongoose.Types.ObjectId | null | undefined) ?? null;
  }
  return result;
};

/**
 * Helper estático: dado un set de categoryIds (las del producto), devuelve
 * los `facetableAttributes` efectivos = unión de la categoría + sus ancestros,
 * deduplicado por `key`. En caso de colisión, gana el nivel más cercano al
 * producto (la categoría directa antes que el ancestro).
 */
categorySchema.statics.getEffectiveFacetableAttributes = async function (
  categoryIds: Array<mongoose.Types.ObjectId | string>
): Promise<IFacetableAttribute[]> {
  if (!categoryIds || categoryIds.length === 0) return [];
  const dedupKey = new Map<string, IFacetableAttribute>();
  // Procesar en orden: primero categoría directa (depth 0), luego ancestros (depth 1, 2…).
  // El primer registro gana, así que el más cercano al producto vence.
  for (const cid of categoryIds) {
    const chain: mongoose.Types.ObjectId[] = await (this as any).getAncestorIds(cid);
    for (let depth = 0; depth < chain.length; depth++) {
      const node = await this.findById(chain[depth]).select('facetableAttributes').lean();
      if (!node || !node.facetableAttributes) continue;
      for (const attr of node.facetableAttributes as IFacetableAttribute[]) {
        if (!dedupKey.has(attr.key)) {
          dedupKey.set(attr.key, attr);
        }
      }
    }
  }
  return Array.from(dedupKey.values()).sort((a, b) => a.order - b.order);
};

export const Category = mongoose.model<ICategory>('Category', categorySchema);
