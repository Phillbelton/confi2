import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import Product from '../models/Product';
import { Format, FormatUnit } from '../models/Format';
import { Flavor } from '../models/Flavor';
import logger from '../config/logger';

/**
 * Importer Quelita-nativo — Excel diseñado para el sistema (NO Bicom).
 *
 * Lee por NOMBRE de columna (no por índice fijo), permitiendo reordenar o
 * agregar campos sin romper el parser.
 *
 * Columnas reconocidas:
 *   sku (identidad primaria, formato QU-XXXXXX, auto-gen si falta),
 *   barcode (informativo, puede duplicarse, no es llave),
 *   name, description,
 *   category (path con '>'), [subcategory, subsubcategory legacy],
 *   brand, provider, flavor, format_value, format_unit,
 *   unitPrice, saleUnit_type, saleUnit_quantity,
 *   tier1_minQty, tier1_price, tier1_label,
 *   tier2_minQty, tier2_price, tier2_label,
 *   tags, featured, active, image_url
 *
 * Categorías de 3 niveles: si subcategory existe se crea bajo category;
 * si subsubcategory existe se crea bajo subcategory. El producto se asigna
 * a la hoja (el nivel más profundo que esté presente).
 *
 * Format y Flavor: se auto-crean si no existen, dedupeados por slug.
 */

export interface QuelitaImportOptions {
  wipeTaxonomy?: boolean;
  limit?: number;
  userId?: string;
}

export interface QuelitaImportReport {
  categoriesCreated: number;
  brandsCreated: number;
  flavorsCreated: number;
  formatsCreated: number;
  productsCreated: number;
  productsUpdated: number;
  errors: Array<{ row: number; barcode?: string; message: string }>;
  durationMs: number;
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

function slugifyName(s: string) {
  return slugify(s, { lower: true, strict: true, locale: 'es' });
}

async function getOrCreateCategory(
  name: string,
  parentId: mongoose.Types.ObjectId | null,
  reportCounters: { categoriesCreated: number }
): Promise<mongoose.Types.ObjectId> {
  // Lookup por (name, parent): más robusto que slug porque el pre-save hook
  // de Category añade timestamp-suffix al slug cuando hay colisión global.
  // Si buscáramos por slug puro nunca encontraríamos las categorías ya creadas
  // con suffix, y crearíamos duplicados infinitos.
  let cat = await Category.findOne({ name, parent: parentId || null });
  if (!cat) {
    cat = await Category.create({
      name,
      parent: parentId || undefined,
      active: true,
    });
    reportCounters.categoriesCreated += 1;
  }
  return cat._id as mongoose.Types.ObjectId;
}

/**
 * Resuelve la cadena de categorías para un producto.
 *
 * Acepta DOS formatos:
 *
 *   A) Path en una sola columna:
 *      category = "Confites > Caramelos > Masticables"
 *      (separador ">", con o sin espacios alrededor)
 *
 *   B) Columnas separadas (legacy):
 *      category = "Confites"
 *      subcategory = "Caramelos"
 *      subsubcategory = "Masticables"
 *
 * Si category contiene ">" se usa formato A y se ignoran sub/subsub.
 * Devuelve el ObjectId de la HOJA (nivel más profundo presente).
 * Auto-crea cada nivel si no existe (lookup por name+parent, robusto a
 * slug-collisions globales).
 */
async function resolveCategoryChain(
  cat: string,
  sub: string,
  subsub: string,
  reportCounters: { categoriesCreated: number }
): Promise<mongoose.Types.ObjectId> {
  if (!cat) throw new Error('category vacío');

  let segments: string[];
  if (cat.includes('>')) {
    // Formato A: path en una columna
    segments = cat.split('>').map((s) => s.trim()).filter(Boolean);
    if (segments.length === 0) throw new Error('category path inválido');
    if (segments.length > 3) {
      throw new Error(
        `Máximo 3 niveles permitidos; recibió ${segments.length}: "${cat}"`
      );
    }
  } else {
    // Formato B: columnas separadas
    segments = [cat, sub, subsub].filter(Boolean);
  }

  let parentId: mongoose.Types.ObjectId | null = null;
  let leafId: mongoose.Types.ObjectId = null as any;
  for (const segment of segments) {
    leafId = await getOrCreateCategory(segment, parentId, reportCounters);
    parentId = leafId;
  }
  return leafId;
}

async function getOrCreateBrand(
  name: string,
  reportCounters: { brandsCreated: number }
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!name || name.length < 2) return undefined;
  // Brand.name tiene unique:true en el schema; lookup case-insensitive por name
  let brand = await Brand.findOne({ name });
  if (!brand) {
    brand = await Brand.create({ name, active: true });
    reportCounters.brandsCreated += 1;
  }
  return brand._id as mongoose.Types.ObjectId;
}

async function getOrCreateFlavor(
  name: string,
  reportCounters: { flavorsCreated: number }
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!name || name.length < 2) return undefined;
  let flavor = await Flavor.findOne({ name });
  if (!flavor) {
    flavor = await Flavor.create({ name, active: true });
    reportCounters.flavorsCreated += 1;
  }
  return flavor._id as mongoose.Types.ObjectId;
}

async function getOrCreateFormat(
  value: number,
  unit: string,
  reportCounters: { formatsCreated: number }
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!value || value <= 0) return undefined;
  const normalizedUnit = unit.toLowerCase().trim() as FormatUnit;
  if (!VALID_FORMAT_UNITS.includes(normalizedUnit)) {
    throw new Error(`format_unit inválida: "${unit}"`);
  }
  let fmt = await Format.findOne({ value, unit: normalizedUnit });
  if (!fmt) {
    fmt = await Format.create({
      value,
      unit: normalizedUnit,
      active: true,
    });
    reportCounters.formatsCreated += 1;
  }
  return fmt._id as mongoose.Types.ObjectId;
}

export async function runQuelitaProductImport(
  buffer: Buffer,
  options: QuelitaImportOptions = {}
): Promise<QuelitaImportReport> {
  const t0 = Date.now();
  const { wipeTaxonomy = false, limit = 0, userId } = options;

  const report: QuelitaImportReport = {
    categoriesCreated: 0,
    brandsCreated: 0,
    flavorsCreated: 0,
    formatsCreated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    errors: [],
    durationMs: 0,
  };

  // 1) Wipe opcional
  if (wipeTaxonomy) {
    logger.info('[import-quelita] Wipe: Product, Brand, Category, Format, Flavor');
    await Product.deleteMany({});
    await Promise.all([
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Format.deleteMany({}),
      Flavor.deleteMany({}),
    ]);
  }

  // 2) Parsear Excel con headers como objetos
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('El Excel no tiene hojas');
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

  if (rows.length === 0) {
    throw new Error('El Excel está vacío o no tiene encabezados reconocibles');
  }

  // Validar header — verificar que existan las columnas mínimas
  const required = ['name', 'category', 'brand', 'unitPrice'];
  const sample = rows[0];
  const missing = required.filter((k) => !(k in sample));
  if (missing.length > 0) {
    throw new Error(`Columnas faltantes en el header: ${missing.join(', ')}`);
  }

  // 3) Importar filas
  const toImport = limit > 0 ? rows.slice(0, limit) : rows;

  for (let i = 0; i < toImport.length; i++) {
    const r = toImport[i];
    const rowNumber = i + 2; // header es fila 1
    const barcode = norm(r.barcode);

    try {
      const name = norm(r.name);
      if (!name || name.length < 3) {
        report.errors.push({ row: rowNumber, barcode, message: 'name faltante o muy corto' });
        continue;
      }

      const description = norm(r.description) || `${name}.`;
      if (description.length < 10) {
        // Padding mínimo para cumplir validación del modelo
        // (description tiene min 10 chars en el schema)
      }

      // Categoría 3 niveles
      const cat = norm(r.category);
      const sub = norm(r.subcategory);
      const subsub = norm(r.subsubcategory);
      if (!cat) {
        report.errors.push({ row: rowNumber, barcode, message: 'category vacía' });
        continue;
      }
      const categoryId = await resolveCategoryChain(cat, sub, subsub, report);

      const brandId = await getOrCreateBrand(norm(r.brand), report);
      const provider = norm(r.provider) || undefined;
      const flavorId = await getOrCreateFlavor(norm(r.flavor), report);

      const formatValue = num(r.format_value);
      const formatUnit = norm(r.format_unit);
      const formatId =
        formatValue > 0 && formatUnit
          ? await getOrCreateFormat(formatValue, formatUnit, report)
          : undefined;

      const unitPrice = Math.round(num(r.unitPrice));
      if (unitPrice <= 0) {
        report.errors.push({ row: rowNumber, barcode, message: 'unitPrice debe ser > 0' });
        continue;
      }

      const saleUnitTypeRaw = norm(r.saleUnit_type).toLowerCase() as SaleUnitType;
      const saleUnitType: SaleUnitType = VALID_SALE_UNITS.includes(saleUnitTypeRaw)
        ? saleUnitTypeRaw
        : 'unidad';
      const saleUnitQuantity = Math.max(1, Math.round(num(r.saleUnit_quantity) || 1));

      // Tiers (hasta 2 niveles desde el Excel, ordenados por minQuantity)
      const tiers: Array<{ minQuantity: number; pricePerUnit: number; label?: string }> = [];
      for (const idx of [1, 2]) {
        const minQty = Math.round(num(r[`tier${idx}_minQty`]));
        const price = Math.round(num(r[`tier${idx}_price`]));
        const label = norm(r[`tier${idx}_label`]) || undefined;
        if (minQty >= 1 && price > 0 && price < unitPrice) {
          tiers.push({ minQuantity: minQty, pricePerUnit: price, label });
        }
      }

      const featured = boolFlag(r.featured);
      const active = r.active === '' ? true : boolFlag(r.active);
      const imageUrl = norm(r.image_url);
      const images = imageUrl ? [imageUrl] : [];

      // Description debe tener min 10 chars; rellenar si quedó corta
      const finalDescription =
        description.length >= 10 ? description : `${name}. ${cat}.`.padEnd(10, ' ');

      // Upsert por sku (identidad primaria). Si no viene sku, fallback a name+brand.
      // barcode YA NO se usa para upsert (puede estar duplicado/vacío en el Excel).
      const sku = norm(r.sku).toUpperCase();
      let product;
      if (sku) {
        product = await Product.findOne({ sku });
      }
      if (!product && brandId) {
        product = await Product.findOne({ name, brand: brandId });
      }

      const productData: any = {
        // sku se incluye solo si vino en el Excel; sino el pre-save hook
        // del modelo lo auto-genera al crear.
        ...(sku ? { sku } : {}),
        name,
        description: finalDescription,
        categories: [categoryId],
        brand: brandId,
        provider,
        flavor: flavorId,
        format: formatId,
        barcode: barcode || undefined,
        unitPrice,
        saleUnit: { type: saleUnitType, quantity: saleUnitQuantity },
        tiers,
        images,
        featured,
        active,
      };

      if (product) {
        Object.assign(product, productData);
        if (userId) product.updatedBy = new mongoose.Types.ObjectId(userId);
        await product.save();
        report.productsUpdated += 1;
      } else {
        productData.createdBy = userId
          ? new mongoose.Types.ObjectId(userId)
          : undefined;
        await Product.create(productData);
        report.productsCreated += 1;
      }
    } catch (err: any) {
      report.errors.push({ row: rowNumber, barcode, message: err?.message || 'error desconocido' });
    }
  }

  report.durationMs = Date.now() - t0;
  return report;
}
