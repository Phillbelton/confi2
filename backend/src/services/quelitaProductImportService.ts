import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import Product from '../models/Product';
import ProductImage from '../models/ProductImage';
import { Format, FormatUnit } from '../models/Format';
import { Flavor } from '../models/Flavor';
import Collection from '../models/Collection';
import { invalidateAllTaxonomyCaches } from './taxonomyCache';
import logger from '../config/logger';

/**
 * Importer Quelita-nativo — Excel diseñado para el sistema (NO Bicom).
 *
 * Lee por NOMBRE de columna (no por índice fijo), permitiendo reordenar o
 * agregar campos sin romper el parser.
 *
 * Esquema multi-presentación: UNA FILA POR PRESENTACIÓN, agrupadas por `sku`.
 * Los datos de producto van en la 1ª fila del grupo; cada fila aporta una
 * presentación + sus tramos.
 *
 * Columnas (es-CL):
 *   Producto (1ª fila del sku): sku, nombre, marca, categoria (path con '>'),
 *     gramaje, medida, sabor (coma-separado → varios sabores), descripcion,
 *     imagen_url, etiquetas, colecciones, destacado, activo.
 *   Presentación (cada fila): presentacion_tipo (unidad|display|embalaje|
 *     cantidad_minima), presentacion_factor, presentacion_precio,
 *     presentacion_principal, presentacion_barcode, presentacion_etiqueta,
 *     tramo1_desde/tramo1_precio, tramo2_desde/tramo2_precio.
 *
 * Auto-crea Category (3 niveles), Brand, Flavor (1..N) y Format.
 * Backward-compat: acepta el formato viejo (1 fila/producto: precio,
 * mayorista y caja como tramos, modo_venta/unidades_por_paquete, tamaño) y
 * alias en inglés vía los fallbacks de readCol.
 *
 * ── RENDIMIENTO (2026-06-21) ──────────────────────────────────────────────
 * La taxonomía (Category/Brand/Flavor/Format/Collection) y los productos
 * existentes se PRECARGAN a Maps en memoria al inicio (un puñado de queries);
 * los get-or-create pegan contra el Map y solo tocan la DB en miss. Las
 * escrituras de productos se baten en `insertMany` (nuevos) + `bulkWrite`
 * (updates) en vez de un `save()` por producto. Esto baja una corrida de
 * ~1400 productos de ~40 min a ~1-3 min → entra en el request del navegador.
 *
 * ⚠️ `insertMany`/`bulkWrite` se saltean los hooks de Mongoose. Para no
 * duplicar los invariantes complejos, cada producto se construye con
 * `new Product(...)` y se corre `await doc.validate()` EN MEMORIA (sin I/O):
 * eso dispara `pre('validate')`, que sincroniza presentaciones↔legacy y
 * denormaliza flavors. Solo `slug` y `sku` (que viven en `pre('save')`) se
 * replican acá abajo (`makeSlug`/`nextSku`). Si el modelo agrega un nuevo
 * campo derivado en pre('validate'), este importer lo hereda gratis; si lo
 * agrega en pre('save'), hay que replicarlo acá.
 */

/** Modo de importación. Ver tabla en QuelitaImportOptions. */
export type QuelitaImportMode = 'replace' | 'upsert' | 'insertNew';

export interface QuelitaImportOptions {
  /**
   * - `replace`  : BORRA todo (productos + taxonomía) y recrea desde el Excel.
   * - `upsert`   : actualiza los existentes (preservando lo curado) + crea nuevos.
   * - `insertNew`: solo inserta los que NO existen; saltea los ya registrados.
   * Default: `insertNew` (el menos destructivo).
   */
  mode?: QuelitaImportMode;
  /** @deprecated Usar `mode`. `true` se mapea a `mode: 'replace'`. */
  wipeTaxonomy?: boolean;
  limit?: number;
  userId?: string;
}

export interface QuelitaImportReport {
  categoriesCreated: number;
  brandsCreated: number;
  flavorsCreated: number;
  formatsCreated: number;
  collectionsCreated: number;
  productsCreated: number;
  productsUpdated: number;
  /** Productos salteados por ya existir (solo en `mode: 'insertNew'`). */
  productsSkipped: number;
  errors: Array<{ row: number; barcode?: string; message: string }>;
  durationMs: number;
}

/** Resuelve el modo efectivo, con back-compat para `wipeTaxonomy`. */
function resolveMode(options: QuelitaImportOptions): QuelitaImportMode {
  if (options.mode) return options.mode;
  if (options.wipeTaxonomy) return 'replace';
  return 'insertNew';
}

/**
 * Helper: lee un valor del row tolerando alias (español primario, inglés legacy).
 */
function readCol(row: Record<string, any>, ...aliases: string[]): any {
  for (const a of aliases) {
    if (a in row && row[a] !== '' && row[a] !== null && row[a] !== undefined) {
      return row[a];
    }
  }
  return '';
}

type SaleUnitType = 'unidad' | 'cantidadMinima' | 'display' | 'embalaje';

const VALID_FORMAT_UNITS: FormatUnit[] = ['g', 'kg', 'ml', 'l', 'cc', 'oz'];
const VALID_SALE_UNITS: SaleUnitType[] = ['unidad', 'cantidadMinima', 'display', 'embalaje'];

function norm(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function boolFlag(v: unknown): boolean {
  const s = String(v ?? '').toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'sí' || s === 'si' || s === 'yes';
}

/** Slug de producto — MISMA config que el hook `pre('save')` de Product. */
function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
}

/** Devuelve un slug único no presente en `used`; lo registra. */
function uniqueSlug(base: string, used: Set<string>): string {
  let candidate = base || 'producto';
  if (used.has(candidate)) {
    let i = 2;
    while (used.has(`${base}-${i}`)) i++;
    candidate = `${base}-${i}`;
  }
  used.add(candidate);
  return candidate;
}

// ──────────────────────────────────────────────────────────────────────────
// Caché de taxonomía en memoria (vive solo durante la corrida del import).
// ──────────────────────────────────────────────────────────────────────────

interface TaxonomyCaches {
  /** key: `${parentId|'root'}::${name}` → categoryId */
  categories: Map<string, mongoose.Types.ObjectId>;
  /** key: slug → brandId */
  brands: Map<string, mongoose.Types.ObjectId>;
  /** key: slug → flavorId */
  flavors: Map<string, mongoose.Types.ObjectId>;
  /** key: `${value}::${unit}` → formatId */
  formats: Map<string, mongoose.Types.ObjectId>;
  /** key: name (exacto) → collectionId */
  collections: Map<string, mongoose.Types.ObjectId>;
}

const catKey = (parentId: mongoose.Types.ObjectId | null, name: string) =>
  `${parentId ? parentId.toString() : 'root'}::${name}`;

const brandFlavorSlug = (name: string) =>
  slugify(name, { lower: true, strict: true, locale: 'es' });

/** Precarga toda la taxonomía existente a Maps (4 + 1 queries). */
async function buildCaches(): Promise<TaxonomyCaches> {
  const [cats, brands, flavors, formats, collections] = await Promise.all([
    Category.find({}).select('_id name parent slug').lean(),
    Brand.find({}).select('_id name slug').lean(),
    Flavor.find({}).select('_id name slug').lean(),
    Format.find({}).select('_id value unit slug').lean(),
    Collection.find({}).select('_id name').lean(),
  ]);

  const caches: TaxonomyCaches = {
    categories: new Map(),
    brands: new Map(),
    flavors: new Map(),
    formats: new Map(),
    collections: new Map(),
  };

  for (const c of cats as any[]) {
    caches.categories.set(catKey(c.parent || null, c.name), c._id);
  }
  for (const b of brands as any[]) {
    caches.brands.set(b.slug || brandFlavorSlug(b.name), b._id);
  }
  for (const f of flavors as any[]) {
    caches.flavors.set(f.slug || brandFlavorSlug(f.name), f._id);
  }
  for (const f of formats as any[]) {
    caches.formats.set(`${f.value}::${f.unit}`, f._id);
  }
  for (const c of collections as any[]) {
    caches.collections.set(c.name, c._id);
  }
  return caches;
}

async function cachedCategory(
  name: string,
  parentId: mongoose.Types.ObjectId | null,
  caches: TaxonomyCaches,
  report: QuelitaImportReport
): Promise<mongoose.Types.ObjectId> {
  const key = catKey(parentId, name);
  const hit = caches.categories.get(key);
  if (hit) return hit;

  // Miss: lookup defensivo por (name, parent) — identidad conceptual real —
  // y crear si no existe. El pre-save de Category sufija el slug ante colisión
  // global, por eso el lookup NO es por slug puro.
  let cat = await Category.findOne({ name, parent: parentId || null });
  if (!cat) {
    try {
      cat = await Category.create({ name, parent: parentId || undefined, active: true });
      report.categoriesCreated += 1;
    } catch (err: any) {
      if (err?.code === 11000) {
        cat = await Category.findOne({ name, parent: parentId || null });
        if (!cat) throw err;
      } else {
        throw err;
      }
    }
  }
  caches.categories.set(key, cat._id as mongoose.Types.ObjectId);
  return cat._id as mongoose.Types.ObjectId;
}

/**
 * Resuelve la cadena de categorías. Acepta path "A > B > C" (formato A) o
 * columnas separadas (legacy). Devuelve el id de la hoja. Auto-crea niveles.
 */
async function resolveCategoryChain(
  cat: string,
  sub: string,
  subsub: string,
  caches: TaxonomyCaches,
  report: QuelitaImportReport
): Promise<mongoose.Types.ObjectId> {
  if (!cat) throw new Error('category vacío');

  let segments: string[];
  if (cat.includes('>')) {
    segments = cat.split('>').map((s) => s.trim()).filter(Boolean);
    if (segments.length === 0) throw new Error('category path inválido');
    if (segments.length > 3) {
      throw new Error(`Máximo 3 niveles permitidos; recibió ${segments.length}: "${cat}"`);
    }
  } else {
    segments = [cat, sub, subsub].filter(Boolean);
  }

  let parentId: mongoose.Types.ObjectId | null = null;
  let leafId: mongoose.Types.ObjectId = null as any;
  for (const segment of segments) {
    leafId = await cachedCategory(segment, parentId, caches, report);
    parentId = leafId;
  }
  return leafId;
}

async function cachedBrand(
  name: string,
  caches: TaxonomyCaches,
  report: QuelitaImportReport
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!name || name.length < 2) return undefined;
  const slug = brandFlavorSlug(name);
  const hit = caches.brands.get(slug);
  if (hit) return hit;

  let brand = await Brand.findOne({ $or: [{ name }, { slug }] });
  if (!brand) {
    try {
      brand = await Brand.create({ name, active: true });
      report.brandsCreated += 1;
    } catch (err: any) {
      if (err?.code === 11000) {
        brand = await Brand.findOne({ slug });
        if (!brand) throw err;
      } else {
        throw err;
      }
    }
  }
  caches.brands.set(slug, brand._id as mongoose.Types.ObjectId);
  return brand._id as mongoose.Types.ObjectId;
}

async function cachedFlavor(
  name: string,
  caches: TaxonomyCaches,
  report: QuelitaImportReport
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!name || name.length < 2) return undefined;
  const slug = brandFlavorSlug(name);
  const hit = caches.flavors.get(slug);
  if (hit) return hit;

  let flavor = await Flavor.findOne({ $or: [{ name }, { slug }] });
  if (!flavor) {
    try {
      flavor = await Flavor.create({ name, active: true });
      report.flavorsCreated += 1;
    } catch (err: any) {
      if (err?.code === 11000) {
        flavor = await Flavor.findOne({ slug });
        if (!flavor) throw err;
      } else {
        throw err;
      }
    }
  }
  caches.flavors.set(slug, flavor._id as mongoose.Types.ObjectId);
  return flavor._id as mongoose.Types.ObjectId;
}

async function cachedFormat(
  value: number,
  unit: string,
  caches: TaxonomyCaches,
  report: QuelitaImportReport
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!value || value <= 0) return undefined;
  const normalizedUnit = unit.toLowerCase().trim() as FormatUnit;
  if (!VALID_FORMAT_UNITS.includes(normalizedUnit)) {
    throw new Error(`format_unit inválida: "${unit}"`);
  }
  const key = `${value}::${normalizedUnit}`;
  const hit = caches.formats.get(key);
  if (hit) return hit;

  const unitLabel: Record<FormatUnit, string> = {
    g: 'g', kg: 'kg', ml: 'ml', l: 'L', cc: 'cc', oz: 'oz',
  };
  const expectedSlug = slugify(`${value}${unitLabel[normalizedUnit]}`, { lower: true, strict: true });
  let fmt = await Format.findOne({
    $or: [{ value, unit: normalizedUnit }, { slug: expectedSlug }],
  });
  if (!fmt) {
    try {
      fmt = await Format.create({ value, unit: normalizedUnit, active: true });
      report.formatsCreated += 1;
    } catch (err: any) {
      if (err?.code === 11000) {
        fmt = await Format.findOne({ slug: expectedSlug });
        if (!fmt) throw err;
      } else {
        throw err;
      }
    }
  }
  caches.formats.set(key, fmt._id as mongoose.Types.ObjectId);
  return fmt._id as mongoose.Types.ObjectId;
}

async function cachedCollection(
  name: string,
  caches: TaxonomyCaches,
  report: QuelitaImportReport
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!name || name.length < 2) return undefined;
  const hit = caches.collections.get(name);
  if (hit) return hit;
  let col = await Collection.findOne({ name });
  if (!col) {
    col = await Collection.create({ name, active: true, showOnHome: false, products: [] });
    report.collectionsCreated += 1;
  }
  caches.collections.set(name, col._id as mongoose.Types.ObjectId);
  return col._id as mongoose.Types.ObjectId;
}

// ──────────────────────────────────────────────────────────────────────────

type AssignOrUnset = { set: Record<string, any>; unset: Record<string, any> };
function assignOrUnset(acc: AssignOrUnset, field: string, value: any): void {
  if (value === undefined || value === null) acc.unset[field] = '';
  else acc.set[field] = value;
}

/** insertMany chunked y tolerante a errores parciales (ordered:false). */
async function flushInserts(
  docs: mongoose.Document[],
  report: QuelitaImportReport
): Promise<void> {
  const CHUNK = 500;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const chunk = docs.slice(i, i + CHUNK);
    try {
      const inserted = await Product.insertMany(chunk, { ordered: false });
      report.productsCreated += inserted.length;
    } catch (err: any) {
      report.productsCreated += Array.isArray(err?.insertedDocs) ? err.insertedDocs.length : 0;
      const writeErrors: any[] = err?.writeErrors || [];
      if (writeErrors.length) {
        for (const we of writeErrors) {
          const idx = we?.index ?? we?.err?.index;
          const nameHint = (chunk[idx] as any)?.name ?? '?';
          report.errors.push({
            row: -1,
            message: `No se pudo insertar "${nameHint}": ${we?.err?.errmsg || we?.errmsg || 'error'}`,
          });
        }
      } else {
        report.errors.push({ row: -1, message: `Error al insertar lote: ${err?.message || err}` });
      }
    }
  }
}

/** bulkWrite chunked de updates; cuenta por matchedCount. */
async function flushUpdates(
  ops: any[],
  report: QuelitaImportReport
): Promise<void> {
  const CHUNK = 500;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const chunk = ops.slice(i, i + CHUNK);
    try {
      const res = await Product.bulkWrite(chunk, { ordered: false });
      report.productsUpdated += res.matchedCount ?? 0;
    } catch (err: any) {
      const res = err?.result;
      report.productsUpdated += res?.matchedCount ?? res?.nMatched ?? 0;
      const writeErrors: any[] = err?.writeErrors || [];
      if (writeErrors.length) {
        for (const we of writeErrors) {
          report.errors.push({ row: -1, message: `update: ${we?.err?.errmsg || we?.errmsg || 'error'}` });
        }
      } else {
        report.errors.push({ row: -1, message: `Error al actualizar lote: ${err?.message || err}` });
      }
    }
  }
}

export async function runQuelitaProductImport(
  buffer: Buffer,
  options: QuelitaImportOptions = {}
): Promise<QuelitaImportReport> {
  const t0 = Date.now();
  const mode = resolveMode(options);
  const { limit = 0, userId } = options;

  const report: QuelitaImportReport = {
    categoriesCreated: 0,
    brandsCreated: 0,
    flavorsCreated: 0,
    formatsCreated: 0,
    collectionsCreated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsSkipped: 0,
    errors: [],
    durationMs: 0,
  };

  // 1) Parsear Excel. Hoja "Productos" del template (4 hojas); fallback a la 1ª.
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets['Productos'] || wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('El Excel no tiene hojas');
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

  if (rows.length === 0) {
    throw new Error('El Excel está vacío o no tiene encabezados reconocibles');
  }

  // Validar header — columnas mínimas (acepta ES o EN)
  const sample = rows[0];
  const hasAny = (...names: string[]) => names.some((n) => n in sample);
  const missing: string[] = [];
  if (!hasAny('nombre', 'name')) missing.push('nombre');
  if (!hasAny('categoria', 'category')) missing.push('categoria');
  if (!hasAny('marca', 'brand')) missing.push('marca');
  if (!hasAny('precio', 'presentacion_precio', 'unitPrice')) missing.push('precio');
  if (missing.length > 0) {
    throw new Error(`Columnas faltantes en el header: ${missing.join(', ')}`);
  }

  // 2) Wipe SOLO en modo replace, y recién DESPUÉS de validar el archivo, para
  //    que un Excel inválido NUNCA borre el catálogo.
  if (mode === 'replace') {
    logger.info('[import-quelita] Modo replace: wipe de Product, Brand, Category, Format, Flavor, Collection');
    await Product.deleteMany({});
    await Promise.all([
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Format.deleteMany({}),
      Flavor.deleteMany({}),
      Collection.deleteMany({}),
    ]);
  }

  // 3) Agrupar filas por sku → un producto con N presentaciones.
  const toImport = limit > 0 ? rows.slice(0, limit) : rows;

  type RowRef = { r: Record<string, any>; rowNumber: number };
  const groups = new Map<string, RowRef[]>();
  const order: string[] = [];
  toImport.forEach((r, i) => {
    const rowNumber = i + 2; // header es fila 1
    const skuKey = norm(readCol(r, 'sku')).toUpperCase() || `__row_${rowNumber}`;
    if (!groups.has(skuKey)) {
      groups.set(skuKey, []);
      order.push(skuKey);
    }
    groups.get(skuKey)!.push({ r, rowNumber });
  });

  // 4) PRECARGAS en memoria (taxonomía + productos existentes + imágenes).
  const caches = await buildCaches();

  // Productos existentes → Map por sku y por name+brand (para new-vs-existing
  // sin un findOne por producto). Una sola query del catálogo entero.
  const existing = (await Product.find({})
    .select('_id sku name slug brand images')
    .lean()) as Array<{
    _id: mongoose.Types.ObjectId;
    sku?: string;
    name: string;
    slug?: string;
    brand?: mongoose.Types.ObjectId;
    images?: string[];
  }>;
  const bySku = new Map<string, (typeof existing)[number]>();
  const byNameBrand = new Map<string, (typeof existing)[number]>();
  const usedSlugs = new Set<string>();
  const nbKey = (name: string, brand?: mongoose.Types.ObjectId | string) =>
    `${name.toLowerCase()}::${brand ? String(brand) : ''}`;
  for (const p of existing) {
    if (p.sku) bySku.set(p.sku, p);
    byNameBrand.set(nbKey(p.name, p.brand), p);
    if (p.slug) usedSlugs.add(p.slug);
  }

  // Imágenes persistentes por SKU (sobreviven a wipes) → Map.
  const skusInExcel = order
    .map((k) => norm(readCol(groups.get(k)![0].r, 'sku')).toUpperCase())
    .filter(Boolean);
  const imagesBySku = new Map<string, string[]>();
  if (skusInExcel.length > 0) {
    const imgs = (await ProductImage.find({ sku: { $in: skusInExcel } })
      .select('sku url order')
      .sort({ order: 1 })
      .lean()) as Array<{ sku: string; url: string }>;
    for (const im of imgs) {
      const arr = imagesBySku.get(im.sku) || [];
      arr.push(im.url);
      imagesBySku.set(im.sku, arr);
    }
  }

  // Contador de SKU autogenerado, sembrado desde el último QU-N existente.
  const lastQu = (await Product.findOne({ sku: { $regex: /^QU-\d+$/ } })
    .sort({ sku: -1 })
    .select('sku')
    .lean()) as { sku?: string } | null;
  let skuCounter = 0;
  if (lastQu?.sku) {
    const parsed = parseInt(lastQu.sku.replace('QU-', ''), 10);
    if (Number.isFinite(parsed)) skuCounter = parsed;
  }
  const nextSku = () => `QU-${String(++skuCounter).padStart(6, '0')}`;

  // Construye UNA presentación desde una fila (acepta columnas nuevas y legacy).
  const buildPresentation = (r: Record<string, any>) => {
    const typeRaw = norm(readCol(r, 'presentacion_tipo', 'modo_venta', 'saleUnit_type')).toLowerCase();
    const typeNorm = (typeRaw === 'cantidad_minima' ? 'cantidadMinima' : typeRaw) as SaleUnitType;
    const type: SaleUnitType = VALID_SALE_UNITS.includes(typeNorm) ? typeNorm : 'unidad';
    const quantity =
      type === 'unidad'
        ? 1
        : Math.max(1, Math.round(num(readCol(r, 'presentacion_factor', 'unidades_por_paquete', 'saleUnit_quantity')) || 1));
    const unitPrice = Math.round(num(readCol(r, 'presentacion_precio', 'precio', 'unitPrice')));
    const tiers: Array<{ minQuantity: number; pricePerUnit: number; label?: string }> = [];
    const t1Min = Math.round(num(readCol(r, 'tramo1_desde', 'mayorista_min', 'tier1_minQty')));
    const t1Pre = Math.round(num(readCol(r, 'tramo1_precio', 'mayorista_precio', 'tier1_price')));
    if (t1Min >= 1 && t1Pre > 0 && t1Pre < unitPrice) {
      tiers.push({ minQuantity: t1Min, pricePerUnit: t1Pre, label: 'Mayorista' });
    }
    const t2Min = Math.round(num(readCol(r, 'tramo2_desde', 'caja_min', 'tier2_minQty')));
    const t2Pre = Math.round(num(readCol(r, 'tramo2_precio', 'caja_precio', 'tier2_price')));
    if (t2Min >= 1 && t2Pre > 0 && t2Pre < unitPrice) {
      tiers.push({ minQuantity: t2Min, pricePerUnit: t2Pre, label: 'Caja' });
    }
    return {
      type,
      quantity,
      unitPrice,
      tiers,
      label: norm(readCol(r, 'presentacion_etiqueta')) || undefined,
      barcode: norm(readCol(r, 'presentacion_barcode')) || undefined,
      principal: boolFlag(readCol(r, 'presentacion_principal')),
    };
  };

  // 5) Construir las operaciones (sin tocar la DB salvo creates de taxonomía).
  const toInsert: mongoose.Document[] = [];
  const updateOps: any[] = [];
  const colAssignments = new Map<string, Set<string>>(); // colId → Set<productId>
  const addCollection = (colId: mongoose.Types.ObjectId, productId: mongoose.Types.ObjectId) => {
    const k = colId.toString();
    if (!colAssignments.has(k)) colAssignments.set(k, new Set());
    colAssignments.get(k)!.add(productId.toString());
  };

  for (const key of order) {
    const groupRows = groups.get(key)!;
    const first = groupRows[0].r;
    const rowNumber = groupRows[0].rowNumber;
    const barcode = norm(readCol(first, 'codigo_barras', 'barcode'));

    try {
      const name = norm(readCol(first, 'nombre', 'name'));
      if (!name || name.length < 3) {
        report.errors.push({ row: rowNumber, barcode, message: 'nombre faltante o muy corto' });
        continue;
      }

      const description = norm(readCol(first, 'descripcion', 'description')) || `${name}.`;

      const cat = norm(readCol(first, 'categoria', 'category'));
      const sub = norm(readCol(first, 'subcategory'));
      const subsub = norm(readCol(first, 'subsubcategory'));
      if (!cat) {
        report.errors.push({ row: rowNumber, barcode, message: 'categoria vacía' });
        continue;
      }
      const categoryId = await resolveCategoryChain(cat, sub, subsub, caches, report);
      const brandId = await cachedBrand(norm(readCol(first, 'marca', 'brand')), caches, report);

      // Sabores coma-separados → flavors[] (multi).
      const flavorIds: mongoose.Types.ObjectId[] = [];
      const seenFlavor = new Set<string>();
      for (const tok of norm(readCol(first, 'sabor', 'flavor')).split(',').map((s) => s.trim()).filter(Boolean)) {
        const id = await cachedFlavor(tok, caches, report);
        if (id && !seenFlavor.has(id.toString())) {
          seenFlavor.add(id.toString());
          flavorIds.push(id);
        }
      }

      const formatValue = num(readCol(first, 'gramaje', 'tamaño', 'tamano', 'format_value'));
      const formatUnit = norm(readCol(first, 'medida', 'format_unit'));
      const formatId =
        formatValue > 0 && formatUnit
          ? await cachedFormat(formatValue, formatUnit, caches, report)
          : undefined;

      // Presentaciones: una por fila del grupo; se descartan las de precio <= 0.
      const presentaciones = groupRows.map((gr) => buildPresentation(gr.r)).filter((p) => p.unitPrice > 0);
      if (presentaciones.length === 0) {
        report.errors.push({ row: rowNumber, barcode, message: 'sin presentación válida (precio > 0)' });
        continue;
      }
      let principalIdx = presentaciones.findIndex((p) => p.principal);
      if (principalIdx < 0) principalIdx = 0;
      presentaciones.forEach((p, i) => {
        p.principal = i === principalIdx;
      });

      const featured = boolFlag(readCol(first, 'destacado', 'featured'));
      const activeRaw = readCol(first, 'activo', 'active');
      const active = activeRaw === '' ? true : boolFlag(activeRaw);
      const imageUrl = norm(readCol(first, 'imagen_url', 'image_url'));
      const excelImages = imageUrl ? [imageUrl] : [];

      const collectionNames = norm(readCol(first, 'colecciones'))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const finalDescription =
        description.length >= 10 ? description : `${name}. ${cat}.`.padEnd(10, ' ');

      const sku = norm(readCol(first, 'sku')).toUpperCase();

      // ¿Existe ya? (por sku, o fallback name+brand). Decide el modo.
      const match = sku ? bySku.get(sku) : byNameBrand.get(nbKey(name, brandId));
      if (mode === 'insertNew' && match) {
        report.productsSkipped += 1;
        continue;
      }

      // Imágenes: hidratadas desde ProductImage por SKU + imagen_url del Excel.
      const hydratedImages = sku ? imagesBySku.get(sku) || [] : [];
      const finalImages =
        excelImages.length > 0 && !hydratedImages.some((u) => excelImages.includes(u))
          ? [...hydratedImages, ...excelImages]
          : hydratedImages.length > 0
          ? hydratedImages
          : excelImages;

      const productData: any = {
        ...(sku ? { sku } : {}),
        name,
        description: finalDescription,
        categories: [categoryId],
        brand: brandId,
        flavors: flavorIds,
        format: formatId,
        barcode: barcode || undefined,
        presentaciones,
        images: finalImages,
        featured,
        active,
      };

      // Validar EN MEMORIA → corre pre('validate'): sincroniza presentaciones↔
      // legacy (unitPrice/saleUnit/tiers/fixedDiscount) y denormaliza flavors.
      const doc = new Product(productData);
      try {
        await doc.validate();
      } catch (ve: any) {
        report.errors.push({ row: rowNumber, barcode, message: ve?.message || 'validación falló' });
        continue;
      }
      const obj = doc.toObject({ virtuals: false, depopulate: true, flattenMaps: true }) as any;

      if (match) {
        // UPDATE (mode upsert): pisa estructura/precio, preserva lo curado.
        const acc: AssignOrUnset = {
          set: {
            name: obj.name,
            categories: obj.categories,
            flavors: obj.flavors,
            presentaciones: obj.presentaciones,
            unitPrice: obj.unitPrice,
            saleUnit: obj.saleUnit,
            tiers: obj.tiers,
            images: finalImages,
            active: obj.active,
            updatedAt: new Date(),
          },
          unset: {},
        };
        assignOrUnset(acc, 'brand', obj.brand);
        assignOrUnset(acc, 'format', obj.format);
        assignOrUnset(acc, 'flavor', obj.flavor);
        assignOrUnset(acc, 'barcode', obj.barcode);
        assignOrUnset(acc, 'fixedDiscount', obj.fixedDiscount);
        if (userId) acc.set.updatedBy = new mongoose.Types.ObjectId(userId);

        // Description: solo pisar si el Excel trae una real (no auto-generada).
        const excelDescRaw = norm(readCol(first, 'descripcion', 'description'));
        if (excelDescRaw && excelDescRaw.length >= 10) acc.set.description = obj.description;
        // Featured: solo si el Excel explicitó la columna.
        if (readCol(first, 'destacado', 'featured') !== '') acc.set.featured = obj.featured;
        // Slug: solo recalcular si cambió el nombre.
        if (match.name !== obj.name) acc.set.slug = uniqueSlug(makeSlug(obj.name), usedSlugs);

        const update: any = { $set: acc.set };
        if (Object.keys(acc.unset).length) update.$unset = acc.unset;
        updateOps.push({ updateOne: { filter: { _id: match._id }, update } });

        for (const colName of collectionNames) {
          const colId = await cachedCollection(colName, caches, report);
          if (colId) addCollection(colId, match._id);
        }
      } else {
        // INSERT (modo replace/upsert/insertNew con producto nuevo).
        doc.sku = sku || nextSku();
        doc.slug = uniqueSlug(makeSlug(obj.name), usedSlugs);
        if (userId) doc.set('createdBy', new mongoose.Types.ObjectId(userId));
        toInsert.push(doc);
        // Registrar en el Map para que duplicados dentro del MISMO archivo no
        // se inserten dos veces (y para idempotencia name+brand sin sku).
        const stub = { _id: doc._id, sku: doc.sku, name, brand: brandId } as (typeof existing)[number];
        if (doc.sku) bySku.set(doc.sku, stub);
        byNameBrand.set(nbKey(name, brandId), stub);

        for (const colName of collectionNames) {
          const colId = await cachedCollection(colName, caches, report);
          if (colId) addCollection(colId, doc._id as mongoose.Types.ObjectId);
        }
      }
    } catch (err: any) {
      report.errors.push({ row: rowNumber, barcode, message: err?.message || 'error desconocido' });
    }
  }

  // 6) Escribir en lote.
  await flushInserts(toInsert, report);
  await flushUpdates(updateOps, report);

  // Colecciones: $addToSet (idempotente) de los productos asignados.
  if (colAssignments.size > 0) {
    const colOps = [...colAssignments.entries()].map(([colId, prodIds]) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(colId) },
        update: {
          $addToSet: {
            products: { $each: [...prodIds].map((id) => new mongoose.Types.ObjectId(id)) },
          },
        },
      },
    }));
    try {
      await Collection.bulkWrite(colOps, { ordered: false });
    } catch (err: any) {
      logger.warn(`[import-quelita] Falla al asignar colecciones: ${err?.message || err}`);
    }
  }

  // El importer auto-crea taxonomía sobre la marcha → invalidar el caché de lectura.
  invalidateAllTaxonomyCaches();

  report.durationMs = Date.now() - t0;
  return report;
}
