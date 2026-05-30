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
 * Columnas reconocidas (TODAS en español):
 *   sku                      (identidad primaria QU-XXXXXX, auto-gen si falta)
 *   codigo_barras            (informativo, puede duplicarse)
 *   nombre                   (obligatorio)
 *   marca                    (obligatorio, auto-crea Brand)
 *   categoria                (path con '>', ej. "Galletas > Dulces > Con relleno")
 *   tamaño                   (peso/volumen de UNA unidad física)
 *   medida                   (g / kg / ml / l / cc / oz, auto-crea Format)
 *   sabor                    (opcional, auto-crea Flavor)
 *   modo_venta               (unidad | cantidad_minima | display | embalaje)
 *   unidades_por_paquete     (1 si unidad, N si display, etc.)
 *   precio                   (CLP, precio de UNA presentación de venta)
 *   mayorista_min            (cantidad mínima para precio mayorista)
 *   mayorista_precio         (CLP por presentación)
 *   caja_min                 (cantidad mínima para precio caja)
 *   caja_precio              (CLP por presentación)
 *   descripcion              (texto comercial)
 *   imagen_url               (1 URL Cloudinary)
 *   etiquetas                (comma-separated, ej. "promo,verano")
 *   colecciones              (comma-separated, auto-crea Collections y asigna)
 *   destacado                (TRUE/FALSE)
 *   activo                   (TRUE/FALSE, default TRUE)
 *
 * Backward-compat: si vienen columnas en inglés (legacy), también las acepta.
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
  collectionsCreated: number;
  productsCreated: number;
  productsUpdated: number;
  errors: Array<{ row: number; barcode?: string; message: string }>;
  durationMs: number;
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

function slugifyName(s: string) {
  return slugify(s, { lower: true, strict: true, locale: 'es' });
}

async function getOrCreateCategory(
  name: string,
  parentId: mongoose.Types.ObjectId | null,
  reportCounters: { categoriesCreated: number }
): Promise<mongoose.Types.ObjectId> {
  // Lookup por (name, parent): es la identidad conceptual real.
  // El pre-save de Category añade timestamp-suffix al slug cuando hay
  // colisión global (Category.slug es unique globalmente), por eso no
  // podemos lookup por slug puro.
  let cat = await Category.findOne({ name, parent: parentId || null });
  if (!cat) {
    try {
      cat = await Category.create({
        name,
        parent: parentId || undefined,
        active: true,
      });
      reportCounters.categoriesCreated += 1;
    } catch (err: any) {
      if (err?.code === 11000) {
        // Race condition: re-buscar
        cat = await Category.findOne({ name, parent: parentId || null });
        if (!cat) throw err;
      } else {
        throw err;
      }
    }
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
  // Doble lookup: por nombre exacto Y por slug. Cubre el caso donde dos
  // variantes del nombre ("Sra. Judith" y "Sra Judith") slugifican igual.
  const slug = slugify(name, { lower: true, strict: true, locale: 'es' });
  let brand = await Brand.findOne({ $or: [{ name }, { slug }] });
  if (!brand) {
    try {
      brand = await Brand.create({ name, active: true });
      reportCounters.brandsCreated += 1;
    } catch (err: any) {
      // Fallback de race condition: si otro hilo creó antes con mismo slug
      if (err?.code === 11000) {
        brand = await Brand.findOne({ slug });
        if (!brand) throw err;
      } else {
        throw err;
      }
    }
  }
  return brand._id as mongoose.Types.ObjectId;
}

async function getOrCreateFlavor(
  name: string,
  reportCounters: { flavorsCreated: number }
): Promise<mongoose.Types.ObjectId | undefined> {
  if (!name || name.length < 2) return undefined;
  const slug = slugify(name, { lower: true, strict: true, locale: 'es' });
  let flavor = await Flavor.findOne({ $or: [{ name }, { slug }] });
  if (!flavor) {
    try {
      flavor = await Flavor.create({ name, active: true });
      reportCounters.flavorsCreated += 1;
    } catch (err: any) {
      if (err?.code === 11000) {
        flavor = await Flavor.findOne({ slug });
        if (!flavor) throw err;
      } else {
        throw err;
      }
    }
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
  // El slug se auto-genera del label (ej. "35g"). Por si quedó un Format
  // huérfano con mismo slug pero distinto valor/unidad (raro pero posible
  // si hubo wipe parcial), buscamos también por slug derivado.
  const unitLabel: Record<FormatUnit, string> = {
    g: 'g', kg: 'kg', ml: 'ml', l: 'L', cc: 'cc', oz: 'oz',
  };
  const expectedSlug = slugify(`${value}${unitLabel[normalizedUnit]}`, {
    lower: true,
    strict: true,
  });
  let fmt = await Format.findOne({
    $or: [
      { value, unit: normalizedUnit },
      { slug: expectedSlug },
    ],
  });
  if (!fmt) {
    try {
      fmt = await Format.create({
        value,
        unit: normalizedUnit,
        active: true,
      });
      reportCounters.formatsCreated += 1;
    } catch (err: any) {
      if (err?.code === 11000) {
        fmt = await Format.findOne({ slug: expectedSlug });
        if (!fmt) throw err;
      } else {
        throw err;
      }
    }
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
    collectionsCreated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    errors: [],
    durationMs: 0,
  };

  // 1) Wipe opcional
  if (wipeTaxonomy) {
    logger.info('[import-quelita] Wipe: Product, Brand, Category, Format, Flavor, Collection');
    await Product.deleteMany({});
    await Promise.all([
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Format.deleteMany({}),
      Flavor.deleteMany({}),
      Collection.deleteMany({}),
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

  // Validar header — verificar que existan las columnas mínimas (acepta ES o EN)
  const sample = rows[0];
  const hasAny = (...names: string[]) => names.some((n) => n in sample);
  const missing: string[] = [];
  if (!hasAny('nombre', 'name')) missing.push('nombre');
  if (!hasAny('categoria', 'category')) missing.push('categoria');
  if (!hasAny('marca', 'brand')) missing.push('marca');
  if (!hasAny('precio', 'unitPrice')) missing.push('precio');
  if (missing.length > 0) {
    throw new Error(`Columnas faltantes en el header: ${missing.join(', ')}`);
  }

  // 3) Importar filas
  const toImport = limit > 0 ? rows.slice(0, limit) : rows;

  for (let i = 0; i < toImport.length; i++) {
    const r = toImport[i];
    const rowNumber = i + 2; // header es fila 1
    const barcode = norm(readCol(r, 'codigo_barras', 'barcode'));

    try {
      const name = norm(readCol(r, 'nombre', 'name'));
      if (!name || name.length < 3) {
        report.errors.push({ row: rowNumber, barcode, message: 'nombre faltante o muy corto' });
        continue;
      }

      const description = norm(readCol(r, 'descripcion', 'description')) || `${name}.`;

      // Categoría: path con '>' (formato A) o columnas separadas (legacy)
      const cat = norm(readCol(r, 'categoria', 'category'));
      const sub = norm(readCol(r, 'subcategory'));
      const subsub = norm(readCol(r, 'subsubcategory'));
      if (!cat) {
        report.errors.push({ row: rowNumber, barcode, message: 'categoria vacía' });
        continue;
      }
      const categoryId = await resolveCategoryChain(cat, sub, subsub, report);

      const brandId = await getOrCreateBrand(norm(readCol(r, 'marca', 'brand')), report);
      const flavorId = await getOrCreateFlavor(norm(readCol(r, 'sabor', 'flavor')), report);

      const formatValue = num(readCol(r, 'tamaño', 'tamano', 'format_value'));
      const formatUnit = norm(readCol(r, 'medida', 'format_unit'));
      const formatId =
        formatValue > 0 && formatUnit
          ? await getOrCreateFormat(formatValue, formatUnit, report)
          : undefined;

      // Semántica de precios (post-refactor 2026-05-14):
      // El admin escribe el precio de UNA presentación de venta:
      //   - modo_venta=unidad: precio de una unidad atómica
      //   - modo_venta=display: precio del display completo
      //   - modo_venta=embalaje: precio de la caja completa
      //   - modo_venta=cantidad_minima: precio de una unidad individual
      // El backend almacena tal cual (no convierte), el frontend muestra directo.
      const unitPrice = Math.round(num(readCol(r, 'precio', 'unitPrice')));
      if (unitPrice <= 0) {
        report.errors.push({ row: rowNumber, barcode, message: 'precio debe ser > 0' });
        continue;
      }

      // Modo de venta: aceptar tanto 'cantidad_minima' (Excel-friendly) como
      // 'cantidadMinima' (modelo). Normalizar al valor del modelo.
      const saleUnitTypeRaw = norm(readCol(r, 'modo_venta', 'saleUnit_type')).toLowerCase();
      const saleUnitTypeNormalized = saleUnitTypeRaw === 'cantidad_minima'
        ? 'cantidadMinima'
        : (saleUnitTypeRaw as SaleUnitType);
      const saleUnitType: SaleUnitType = VALID_SALE_UNITS.includes(saleUnitTypeNormalized as SaleUnitType)
        ? (saleUnitTypeNormalized as SaleUnitType)
        : 'unidad';
      const saleUnitQuantity = Math.max(
        1,
        Math.round(num(readCol(r, 'unidades_por_paquete', 'saleUnit_quantity')) || 1)
      );

      // Tiers: minQuantity en PRESENTACIONES, pricePerUnit por PRESENTACIÓN.
      // (Ej. para un display: minQuantity=2 significa "2+ displays".)
      const tiers: Array<{ minQuantity: number; pricePerUnit: number; label?: string }> = [];
      const mayMin = Math.round(num(readCol(r, 'mayorista_min', 'tier1_minQty')));
      const mayPrecio = Math.round(num(readCol(r, 'mayorista_precio', 'tier1_price')));
      if (mayMin >= 1 && mayPrecio > 0 && mayPrecio < unitPrice) {
        tiers.push({ minQuantity: mayMin, pricePerUnit: mayPrecio, label: 'Mayorista' });
      }
      const cajaMin = Math.round(num(readCol(r, 'caja_min', 'tier2_minQty')));
      const cajaPrecio = Math.round(num(readCol(r, 'caja_precio', 'tier2_price')));
      if (cajaMin >= 1 && cajaPrecio > 0 && cajaPrecio < unitPrice) {
        tiers.push({ minQuantity: cajaMin, pricePerUnit: cajaPrecio, label: 'Caja completa' });
      }

      const featured = boolFlag(readCol(r, 'destacado', 'featured'));
      const activeRaw = readCol(r, 'activo', 'active');
      const active = activeRaw === '' ? true : boolFlag(activeRaw);
      const imageUrl = norm(readCol(r, 'imagen_url', 'image_url'));
      // images se hidrata desde ProductImage por SKU más abajo (persistencia ante wipes).
      // Si el Excel trae imagen_url explícita, se usa como adicional.
      const excelImages = imageUrl ? [imageUrl] : [];

      // Colecciones (comma-separated, auto-crea por nombre)
      const collectionNames = norm(readCol(r, 'colecciones'))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Description debe tener min 10 chars; rellenar si quedó corta
      const finalDescription =
        description.length >= 10 ? description : `${name}. ${cat}.`.padEnd(10, ' ');

      // Upsert por sku (identidad primaria). Si no viene sku, fallback a name+brand.
      const sku = norm(readCol(r, 'sku')).toUpperCase();
      let product;
      if (sku) {
        product = await Product.findOne({ sku });
      }
      if (!product && brandId) {
        product = await Product.findOne({ name, brand: brandId });
      }

      // HIDRATACIÓN DE IMÁGENES PERSISTENTES por SKU.
      // ProductImage sobrevive a wipes — si existen registros para este SKU
      // (típicamente porque el admin subió imágenes en una sesión previa),
      // se vuelven a vincular automáticamente al Product recién creado/actualizado.
      let hydratedImages: string[] = [];
      if (sku) {
        const persistedImages = await ProductImage.find({ sku })
          .sort({ order: 1 })
          .lean();
        hydratedImages = persistedImages.map((pi) => pi.url);
      }
      // Si Excel trae imagen_url y no está ya en la lista persistida, agrégarla
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
        flavor: flavorId,
        format: formatId,
        barcode: barcode || undefined,
        unitPrice,
        saleUnit: { type: saleUnitType, quantity: saleUnitQuantity },
        tiers,
        images: finalImages,
        featured,
        active,
      };

      let savedProduct;
      if (product) {
        // UPDATE: preservar contenido curado por admin (images, description
        // editada, featured) — el Excel solo manda price/structure. Si el
        // Excel trae un valor explícito (imagen_url, descripcion no auto-gen)
        // entonces sí pisa.
        const updateData = { ...productData };
        // Imágenes: `finalImages` ya vino hidratado desde ProductImage por SKU,
        // y posiblemente con la imagen_url del Excel adicional. Es la fuente
        // de verdad — aplicar sin condiciones.
        // Featured: el Excel puede no traer la columna; solo updatear si el
        // admin explicitó en Excel "destacado=TRUE/FALSE"
        if (readCol(r, 'destacado', 'featured') === '') {
          delete updateData.featured;
        }
        // Description: solo pisar si Excel trae descripción no auto-generada
        // (la auto-gen termina en ". categoría." — heurística simple)
        const excelDescRaw = norm(readCol(r, 'descripcion', 'description'));
        if (!excelDescRaw || excelDescRaw.length < 10) {
          delete updateData.description;
        }
        Object.assign(product, updateData);
        if (userId) product.updatedBy = new mongoose.Types.ObjectId(userId);
        savedProduct = await product.save();
        report.productsUpdated += 1;
      } else {
        productData.createdBy = userId
          ? new mongoose.Types.ObjectId(userId)
          : undefined;
        savedProduct = await Product.create(productData);
        report.productsCreated += 1;
      }

      // Procesar colecciones: lookup o crear por nombre, asignar producto
      // Importante: agregamos el producto al array de Collection.products[]
      for (const colName of collectionNames) {
        if (!colName || colName.length < 2) continue;
        try {
          let col = await Collection.findOne({ name: colName });
          if (!col) {
            col = await Collection.create({
              name: colName,
              active: true,
              showOnHome: false,
              products: [savedProduct._id],
            });
            report.collectionsCreated += 1;
          } else {
            // Agregar producto si no está ya
            const exists = col.products.some(
              (p: mongoose.Types.ObjectId) => p.toString() === savedProduct._id.toString()
            );
            if (!exists) {
              col.products.push(savedProduct._id);
              await col.save();
            }
          }
        } catch (err) {
          // Falla en una collection no aborta el producto entero
          logger.warn(
            `[import-quelita] No se pudo asignar producto ${savedProduct._id} a colección "${colName}": ${(err as Error).message}`
          );
        }
      }
    } catch (err: any) {
      report.errors.push({ row: rowNumber, barcode, message: err?.message || 'error desconocido' });
    }
  }

  // El importer auto-crea Brand/Category/Format/Flavor sobre la marcha;
  // cualquier corrida cambia el contenido de las cuatro taxonomías.
  invalidateAllTaxonomyCaches();

  report.durationMs = Date.now() - t0;
  return report;
}
