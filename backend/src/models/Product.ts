import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

/**
 * Modelo Product (Quelita) — colapsa el split parent+variant.
 * Cada documento es un producto único con:
 *   - precio por unidad (`unitPrice`)
 *   - presentación de venta principal (`saleUnit`) que se muestra como badge
 *   - tramos opcionales de descuento por cantidad (`tiers`)
 *   - atributos físicos filtrables (`format`, `flavor`)
 */

export type SaleUnitType = 'unidad' | 'cantidadMinima' | 'display' | 'embalaje';

export interface ISaleUnit {
  type: SaleUnitType;
  /** Cuántas unidades base contiene esta presentación. 1 para unidad. */
  quantity: number;
}

export interface ITier {
  /** Cantidad mínima (en unidades base) a partir de la cual aplica el tier. */
  minQuantity: number;
  /** Precio efectivo por unidad cuando se alcanza este tier. */
  pricePerUnit: number;
  /** Etiqueta opcional visible al cliente: "Display", "Embalaje". */
  label?: string;
}

export interface IFixedDiscount {
  enabled: boolean;
  type: 'percentage' | 'amount';
  value: number;
  startDate?: Date;
  endDate?: Date;
  badge?: string;
}

/**
 * Presentación de venta (unidad, display, caja master…). Un producto tiene
 * 1..N, una marcada `principal`. Los campos de precio se nombran IGUAL que los
 * del producto (`unitPrice/tiers/fixedDiscount`) a propósito: así una
 * presentación ES un `PriceableProduct` y reutiliza la matemática de precios
 * (`effectiveUnitPrice`, etc.) sin tocar su lógica.
 */
export interface IPresentacion {
  _id?: mongoose.Types.ObjectId;
  type: SaleUnitType;
  /** Factor: unidades base contenidas (1 unidad, 24 display, 144 caja). */
  quantity: number;
  /** Precio de ESTA presentación. */
  unitPrice: number;
  tiers: ITier[];
  fixedDiscount?: IFixedDiscount;
  label?: string;
  barcode?: string;
  principal: boolean;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  /** SKU interno de Quelita, identidad primaria. Formato QU-XXXXXX. Auto-generado. */
  sku: string;
  name: string;
  slug: string;
  description: string;
  brand?: mongoose.Types.ObjectId;
  categories: mongoose.Types.ObjectId[];
  format?: mongoose.Types.ObjectId;
  flavor?: mongoose.Types.ObjectId;
  /** Código de barras del fabricante (EAN-13) o código POS. Puede repetirse,
   *  puede estar vacío. NO se usa como identidad primaria. */
  barcode?: string;

  /** Denormalizado = precio de la presentación principal (sort/filtro/índice). */
  unitPrice: number;
  saleUnit: ISaleUnit;
  tiers: ITier[];
  fixedDiscount?: IFixedDiscount;
  /** Presentaciones de venta (1..N). La principal alimenta los campos legacy de arriba. */
  presentaciones: IPresentacion[];

  images: string[];
  featured: boolean;
  active: boolean;
  views: number;
  attributes: Map<string, string[]>;

  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  hasActiveDiscount: boolean;
  hasActiveTieredDiscount: boolean;
}

const saleUnitSubSchema = new Schema<ISaleUnit>(
  {
    type: {
      type: String,
      enum: ['unidad', 'cantidadMinima', 'display', 'embalaje'],
      required: true,
      default: 'unidad',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'La cantidad debe ser >= 1'],
      default: 1,
    },
  },
  { _id: false }
);

const tierSubSchema = new Schema<ITier>(
  {
    minQuantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    label: { type: String, trim: true, maxlength: 40 },
  },
  { _id: false }
);

// _id: true (default) → identidad estable de la presentación, usada por
// carrito y orden para saber cuál se compró.
const presentacionSubSchema = new Schema<IPresentacion>({
  type: {
    type: String,
    enum: ['unidad', 'cantidadMinima', 'display', 'embalaje'],
    required: true,
    default: 'unidad',
  },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  tiers: { type: [tierSubSchema], default: [] },
  fixedDiscount: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['percentage', 'amount'] },
    value: { type: Number, min: 0 },
    startDate: Date,
    endDate: Date,
    badge: String,
  },
  label: { type: String, trim: true, maxlength: 40 },
  barcode: { type: String, trim: true, maxlength: 32 },
  principal: { type: Boolean, default: false },
});

const productSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      // unique + sparse: garantiza unicidad pero permite docs sin sku temporalmente
      // (el pre-save hook lo asigna en isNew si falta). Sparse evita conflicto cuando
      // hay docs legacy sin sku.
      unique: true,
      sparse: true,
      index: true,
    },
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
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      required: [true, 'Al menos una categoría es requerida'],
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v && v.length > 0,
        message: 'Al menos una categoría es requerida',
      },
    },
    format: { type: Schema.Types.ObjectId, ref: 'Format' },
    flavor: { type: Schema.Types.ObjectId, ref: 'Flavor' },
    barcode: { type: String, trim: true, maxlength: 32 },

    unitPrice: {
      type: Number,
      required: [true, 'El precio unitario es requerido'],
      min: [0, 'El precio no puede ser negativo'],
    },
    saleUnit: { type: saleUnitSubSchema, required: true, default: () => ({ type: 'unidad', quantity: 1 }) },
    tiers: { type: [tierSubSchema], default: [] },
    presentaciones: { type: [presentacionSubSchema], default: [] },

    fixedDiscount: {
      enabled: { type: Boolean, default: false },
      type: { type: String, enum: ['percentage', 'amount'] },
      value: { type: Number, min: 0 },
      startDate: Date,
      endDate: Date,
      badge: String,
    },

    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'Máximo 5 imágenes',
      },
    },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    attributes: {
      type: Map,
      of: [String],
      default: () => new Map<string, string[]>(),
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices
// El listado del catálogo (`GET /api/products?categoria=X`) filtra por
// categoría + active y ordena por createdAt DESC. Compuesto con el campo
// de sort al final permite servir paginación con IXSCAN puro (sin SORT
// in-memory). Verificado con explain() en Atlas: el optimizer elige este
// índice y evita la etapa SORT que tenía el índice anterior {categories,
// active}. Cuando el catálogo crece >5K productos y categorías hot pasan
// los ~800 docs, esto evita latencia de 80-150ms.
productSchema.index({ categories: 1, active: 1, createdAt: -1 });
productSchema.index({ brand: 1, active: 1 });
productSchema.index({ format: 1, active: 1 });
productSchema.index({ flavor: 1, active: 1 });
productSchema.index({ featured: 1, active: 1 });
productSchema.index({ unitPrice: 1, active: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index(
  { barcode: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { barcode: { $type: 'string' } },
  }
);
// Wildcard index para soportar filtros sobre claves dinámicas en `attributes`
productSchema.index({ 'attributes.$**': 1 });
// Filtro "Presentación" del catálogo (Fase 5): productos que se venden por
// display/unidad/etc. derivado de los tipos de sus presentaciones.
productSchema.index({ 'presentaciones.type': 1, active: 1 });

// Virtual: hasActiveDiscount
productSchema.virtual('hasActiveDiscount').get(function () {
  if (!this.fixedDiscount?.enabled) return false;
  const now = new Date();
  const startValid = !this.fixedDiscount.startDate || this.fixedDiscount.startDate <= now;
  const endValid = !this.fixedDiscount.endDate || this.fixedDiscount.endDate >= now;
  return startValid && endValid;
});

// Virtual: hasActiveTieredDiscount
productSchema.virtual('hasActiveTieredDiscount').get(function () {
  return Array.isArray(this.tiers) && this.tiers.length > 0;
});

// Pre-validate: sincronizar presentaciones[] ↔ campos legacy.
//  - Si llegan `presentaciones`, la principal es la fuente de verdad: se
//    denormalizan unitPrice/saleUnit/tiers/fixedDiscount (para índices/orden y
//    back-compat con el código aún no migrado).
//  - Si NO llegan (form/import legacy), se construye la principal desde los
//    campos sueltos.
// Corre en pre('validate') para que los `required` (unitPrice, etc.) pasen.
productSchema.pre('validate', function (next) {
  const doc = this as unknown as IProduct;
  const list: IPresentacion[] = Array.isArray(doc.presentaciones) ? doc.presentaciones : [];

  if (list.length > 0) {
    let idx = list.findIndex((p) => p.principal);
    if (idx < 0) idx = 0;
    list.forEach((p, i) => {
      p.principal = i === idx;
    });
    const pr = list[idx];
    doc.unitPrice = pr.unitPrice;
    doc.saleUnit = { type: pr.type, quantity: pr.quantity };
    doc.tiers = pr.tiers || [];
    doc.fixedDiscount = pr.fixedDiscount;
  } else {
    doc.presentaciones = [
      {
        type: doc.saleUnit?.type || 'unidad',
        quantity: doc.saleUnit?.quantity || 1,
        unitPrice: doc.unitPrice,
        tiers: doc.tiers || [],
        fixedDiscount: doc.fixedDiscount,
        principal: true,
      } as IPresentacion,
    ];
  }

  // Ordenar tiers de cada presentación por minQuantity asc.
  for (const p of doc.presentaciones) {
    if (Array.isArray(p.tiers) && p.tiers.length > 0) {
      p.tiers.sort((a, b) => a.minQuantity - b.minQuantity);
    }
  }
  next();
});

// Pre-save: auto-generar SKU si falta (formato QU-XXXXXX).
// Identidad primaria estable; no cambia aunque el admin edite el nombre.
productSchema.pre('save', async function (next) {
  if (this.isNew && !this.sku) {
    try {
      // Buscar el último QU-N para el siguiente número.
      // Race condition aceptable para uso single-admin (importer es secuencial).
      const last = (await mongoose.models.Product.findOne({
        sku: { $regex: /^QU-\d+$/ },
      })
        .sort({ sku: -1 })
        .select('sku')
        .lean()) as { sku?: string } | null;
      let nextNum = 1;
      if (last?.sku) {
        const parsed = parseInt(last.sku.replace('QU-', ''), 10);
        if (Number.isFinite(parsed)) nextNum = parsed + 1;
      }
      this.sku = `QU-${String(nextNum).padStart(6, '0')}`;
    } catch (err) {
      return next(err as Error);
    }
  }
  next();
});

// Pre-save: generar slug
productSchema.pre('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    const existing = await mongoose.models.Product.findOne({
      slug: this.slug,
      _id: { $ne: this._id },
    });
    if (existing) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Pre-save: ordenar tiers por minQuantity asc
productSchema.pre('save', function (next) {
  if (Array.isArray(this.tiers) && this.tiers.length > 0) {
    this.tiers.sort((a, b) => a.minQuantity - b.minQuantity);
  }
  next();
});

// Pre-save: descartar keys/values en `attributes` que no existan en los
// `facetableAttributes` efectivos de las categorías del producto. Defensivo
// para evitar arrastrar datos huérfanos cuando se borran opciones en admin.
productSchema.pre('save', async function (next) {
  try {
    if (!this.attributes || (this.attributes as any).size === 0) return next();
    if (!Array.isArray(this.categories) || this.categories.length === 0) {
      this.attributes = new Map();
      return next();
    }
    const Category = mongoose.model('Category');
    const effective: Array<{ key: string; options: Array<{ value: string }> }> = await (
      Category as any
    ).getEffectiveFacetableAttributes(this.categories);
    const allowed = new Map<string, Set<string>>(
      effective.map((a) => [a.key, new Set(a.options.map((o) => o.value))])
    );
    const cleaned = new Map<string, string[]>();
    for (const [key, values] of (this.attributes as Map<string, string[]>).entries()) {
      const allowedValues = allowed.get(key);
      if (!allowedValues) continue;
      const filtered = (values || []).filter((v) => allowedValues.has(v));
      if (filtered.length > 0) cleaned.set(key, filtered);
    }
    this.attributes = cleaned;
    next();
  } catch (err) {
    next(err as Error);
  }
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
