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
  if (!hasAny('precio', 'presentacion_precio', 'unitPrice')) missing.push('precio');
  if (missing.length > 0) {
    throw new Error(`Columnas faltantes en el header: ${missing.join(', ')}`);
  }

  // 3) Agrupar filas por sku → un producto con N presentaciones. Los datos de
  //    producto se toman de la 1ª fila del grupo; cada fila aporta una
  //    presentación. Filas sin sku = producto suelto (grupo de 1).
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

      // Categoría: path con '>' (formato A) o columnas separadas (legacy)
      const cat = norm(readCol(first, 'categoria', 'category'));
      const sub = norm(readCol(first, 'subcategory'));
      const subsub = norm(readCol(first, 'subsubcategory'));
      if (!cat) {
        report.errors.push({ row: rowNumber, barcode, message: 'categoria vacía' });
        continue;
      }
      const categoryId = await resolveCategoryChain(cat, sub, subsub, report);

      const brandId = await getOrCreateBrand(norm(readCol(first, 'marca', 'brand')), report);

      // Sabores: coma-separados → flavors[] (multi). El modelo denormaliza flavor=flavors[0].
      const flavorIds: mongoose.Types.ObjectId[] = [];
      const seenFlavor = new Set<string>();
      for (const tok of norm(readCol(first, 'sabor', 'flavor')).split(',').map((s) => s.trim()).filter(Boolean)) {
        const id = await getOrCreateFlavor(tok, report);
        if (id && !seenFlavor.has(id.toString())) {
          seenFlavor.add(id.toString());
          flavorIds.push(id);
        }
      }

      const formatValue = num(readCol(first, 'gramaje', 'tamaño', 'tamano', 'format_value'));
      const formatUnit = norm(readCol(first, 'medida', 'format_unit'));
      const formatId =
        formatValue > 0 && formatUnit
          ? await getOrCreateFormat(formatValue, formatUnit, report)
          : undefined;

      // Presentaciones: una por fila del grupo (precio per-presentación; post-refactor
      // 2026-05-14 se guarda tal cual). Se descartan las de precio <= 0.
      const presentaciones = groupRows.map((gr) => buildPresentation(gr.r)).filter((p) => p.unitPrice > 0);
      if (presentaciones.length === 0) {
        report.errors.push({ row: rowNumber, barcode, message: 'sin presentación válida (precio > 0)' });
        continue;
      }
      // Principal: la marcada en el Excel, o la primera.
      let principalIdx = presentaciones.findIndex((p) => p.principal);
      if (principalIdx < 0) principalIdx = 0;
      presentaciones.forEach((p, i) => {
        p.principal = i === principalIdx;
      });

      const featured = boolFlag(readCol(first, 'destacado', 'featured'));
      const activeRaw = readCol(first, 'activo', 'active');
      const active = activeRaw === '' ? true : boolFlag(activeRaw);
      const imageUrl = norm(readCol(first, 'imagen_url', 'image_url'));
      // images se hidrata desde ProductImage por SKU más abajo (persistencia ante wipes).
      // Si el Excel trae imagen_url explícita, se usa como adicional.
      const excelImages = imageUrl ? [imageUrl] : [];

      // Colecciones (comma-separated, auto-crea por nombre)
      const collectionNames = norm(readCol(first, 'colecciones'))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Description debe tener min 10 chars; rellenar si quedó corta
      const finalDescription =
        description.length >= 10 ? description : `${name}. ${cat}.`.padEnd(10, ' ');

      // Upsert por sku (identidad primaria). Si no viene sku, fallback a name+brand.
      const sku = norm(readCol(first, 'sku')).toUpperCase();
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
        flavors: flavorIds,
        format: formatId,
        barcode: barcode || undefined,
        presentaciones,
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
        if (readCol(first, 'destacado', 'featured') === '') {
          delete updateData.featured;
        }
        // Description: solo pisar si Excel trae descripción no auto-generada
        // (la auto-gen termina en ". categoría." — heurística simple)
        const excelDescRaw = norm(readCol(first, 'descripcion', 'description'));
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
