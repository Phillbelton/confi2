import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import Product from '../models/Product';
import { Format } from '../models/Format';
import { Flavor } from '../models/Flavor';
import { Tag } from '../models/Tag';
import Collection from '../models/Collection';
import logger from '../config/logger';

/**
 * Importer Quelita — Excel "BASE DE DATOS" → modelo Product nuevo (plano).
 *
 * Cada fila del Excel produce 1 Product. La fila puede traer 4 niveles de precio
 * (unidad, display detalle, display mayor, embalaje). Estrategia:
 *   - `unitPrice` = mejor precio unitario disponible (UNITARIO si > 0; sino DISPLAY/uni; sino EMBALAJE/(cajas×uni)).
 *   - `saleUnit` se elige según qué precios estén poblados:
 *      * Si tiene UNITARIO     → 'unidad', quantity=1
 *      * Si solo DISPLAY        → 'display', quantity=UNI
 *      * Si solo EMBALAJE       → 'embalaje', quantity=CAJAS×UNI
 *   - `tiers` se generan con los OTROS niveles existentes:
 *      * UNITARIO + DISPLAY DETALLE → tier { minQuantity=UNI, pricePerUnit=DISPLAY/UNI, label='Display' }
 *      * + DISPLAY MAYOR (≠ detalle) → tier { minQuantity=UNI×2, pricePerUnit=MAYOR/UNI, label='Display × mayor' }
 *      * + EMBALAJE → tier { minQuantity=CAJAS×UNI, pricePerUnit=EMB/total, label='Embalaje' }
 */

export interface ImportOptions {
  /**
   * Borra TODAS las taxonomías + productos + colecciones antes de importar.
   * Borra: Collection, Product, Brand, Category, Format, Flavor, Tag.
   * Útil para arrancar limpio antes de la primera carga.
   */
  wipeTaxonomy?: boolean;
  /** Cantidad máxima de productos a importar. 0 = todos. Default 500. */
  limit?: number;
  /** Usuario que realiza la importación (audit). */
  userId?: string;
}

export interface ImportReport {
  categoriesCreated: number;
  brandsCreated: number;
  productsCreated: number;
  productsUpdated: number;
  errors: Array<{ row: number; barcode?: string; message: string }>;
  durationMs: number;
}

const COL = {
  BARCODE: 2,
  GRUPO: 3,
  PROVEEDOR: 4,
  MARCA: 5,
  NAME: 6,
  DESC_EMBALAJE: 7,
  CAJAS: 8,
  UNI: 9,
  PRECIO_EMBALAJE: 17,
  PRECIO_DISPLAY_MAYOR: 19,
  PRECIO_DISPLAY_DETALLE: 21,
  PRECIO_UNITARIO: 23,
};

function norm(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim().replace(/\s+/g, ' ');
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export async function runProductImport(
  buffer: Buffer,
  options: ImportOptions = {}
): Promise<ImportReport> {
  const t0 = Date.now();
  const { wipeTaxonomy = false, limit = 500, userId } = options;

  const report: ImportReport = {
    categoriesCreated: 0,
    brandsCreated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    errors: [],
    durationMs: 0,
  };

  // 1) Wipe completo de taxonomía y productos (en orden para evitar refs huérfanas)
  if (wipeTaxonomy) {
    logger.info('[import] Wipe completo: Collection, Product, Brand, Category, Format, Flavor, Tag');
    // Primero las que referencian a otras
    await Collection.deleteMany({});
    await Product.deleteMany({});
    // Luego las hojas
    await Promise.all([
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Format.deleteMany({}),
      Flavor.deleteMany({}),
      Tag.deleteMany({}),
    ]);
  }

  // 2) Parsear Excel
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('El Excel no tiene hojas');
  const allRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
  const dataRows = allRows.slice(2);

  const validRows: Array<{ row: number; data: any[] }> = [];
  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    if (norm(r[COL.BARCODE])) validRows.push({ row: i + 3, data: r });
  }

  // 3) Taxonomía completa (categorías y marcas) — siempre se crea entera
  const grupoMap = new Map<string, mongoose.Types.ObjectId>();
  const marcaMap = new Map<string, mongoose.Types.ObjectId>();
  const grupos = new Set<string>();
  const marcas = new Set<string>();
  for (const { data } of validRows) {
    const g = norm(data[COL.GRUPO]);
    const m = norm(data[COL.MARCA]);
    if (g) grupos.add(g);
    if (m) marcas.add(m);
  }

  // Helper: dedupe por slug — si dos nombres colapsan al mismo slug ("Sra. Judith"
  // y "Sra Judith" → "sra-judith"), creamos un solo doc con el primer nombre y
  // mapeamos ambos al mismo _id.
  const slugifyName = (name: string) =>
    slugify(name, { lower: true, strict: true, locale: 'es' });

  // Categorías: agrupar por slug
  const catBySlug = new Map<string, string[]>();
  for (const name of grupos) {
    const s = slugifyName(name);
    if (!catBySlug.has(s)) catBySlug.set(s, []);
    catBySlug.get(s)!.push(name);
  }
  for (const [slug, names] of catBySlug.entries()) {
    const canonical = names[0];
    let cat = await Category.findOne({ slug });
    if (!cat) {
      cat = await Category.create({
        name: canonical,
        description: `Importado desde Excel (${canonical})`,
        active: true,
      });
      report.categoriesCreated += 1;
    }
    // Mapear todas las variantes de nombre al mismo _id
    for (const n of names) grupoMap.set(n, cat._id as mongoose.Types.ObjectId);
  }

  // Marcas: misma estrategia
  const brandBySlug = new Map<string, string[]>();
  for (const name of marcas) {
    const s = slugifyName(name);
    if (!brandBySlug.has(s)) brandBySlug.set(s, []);
    brandBySlug.get(s)!.push(name);
  }
  for (const [slug, names] of brandBySlug.entries()) {
    const canonical = names[0];
    let brand = await Brand.findOne({ slug });
    if (!brand) {
      brand = await Brand.create({ name: canonical, active: true });
      report.brandsCreated += 1;
    }
    for (const n of names) marcaMap.set(n, brand._id as mongoose.Types.ObjectId);
  }

  // 4) Subset estratificado
  let rowsToImport = validRows;
  if (limit > 0 && validRows.length > limit) {
    rowsToImport = stratifiedSample(validRows, limit);
  }

  // 5) Crear/actualizar productos
  for (const { row, data } of rowsToImport) {
    const barcode = norm(data[COL.BARCODE]);
    try {
      const grupo = norm(data[COL.GRUPO]);
      const marca = norm(data[COL.MARCA]);
      const provider = norm(data[COL.PROVEEDOR]);
      const name = norm(data[COL.NAME]);
      const descEmb = norm(data[COL.DESC_EMBALAJE]);

      if (!name || name.length < 3) {
        report.errors.push({ row, barcode, message: 'Nombre faltante o muy corto' });
        continue;
      }
      const categoryId = grupoMap.get(grupo);
      if (!categoryId) {
        report.errors.push({ row, barcode, message: `Grupo '${grupo}' sin categoría` });
        continue;
      }
      const brandId = marca ? marcaMap.get(marca) : undefined;

      const description =
        descEmb && descEmb !== name && descEmb.length >= 10
          ? descEmb
          : `${name}. Producto de la categoría ${grupo}${marca ? ` — marca ${marca}` : ''}.`;

      // Datos de venta
      const cajas = num(data[COL.CAJAS]);
      const uni = num(data[COL.UNI]);
      const pUnit = num(data[COL.PRECIO_UNITARIO]);
      const pDisplayDet = num(data[COL.PRECIO_DISPLAY_DETALLE]);
      const pDisplayMay = num(data[COL.PRECIO_DISPLAY_MAYOR]);
      const pEmbalaje = num(data[COL.PRECIO_EMBALAJE]);

      const totalEmbalaje = cajas > 0 && uni > 0 ? cajas * uni : 0;

      // Determinar unitPrice y saleUnit
      let unitPrice = 0;
      let saleUnit: { type: 'unidad' | 'display' | 'embalaje'; quantity: number } = {
        type: 'unidad',
        quantity: 1,
      };

      if (pUnit > 0) {
        unitPrice = Math.round(pUnit);
        saleUnit = { type: 'unidad', quantity: 1 };
      } else if (pDisplayDet > 0 && uni > 0) {
        unitPrice = Math.round(pDisplayDet / uni);
        saleUnit = { type: 'display', quantity: Math.round(uni) };
      } else if (pEmbalaje > 0 && totalEmbalaje > 0) {
        unitPrice = Math.round(pEmbalaje / totalEmbalaje);
        saleUnit = { type: 'embalaje', quantity: Math.round(totalEmbalaje) };
      } else {
        report.errors.push({
          row,
          barcode,
          message: 'Sin precios definidos (unitario/display/embalaje todos en 0)',
        });
        continue;
      }

      // Construir tiers desde los niveles que NO eligió el saleUnit
      const tiers: Array<{ minQuantity: number; pricePerUnit: number; label?: string }> = [];

      // Display detalle (si hay precio unitario también, sino ya es saleUnit)
      if (saleUnit.type === 'unidad' && pDisplayDet > 0 && uni > 0) {
        const ppu = Math.round(pDisplayDet / uni);
        if (ppu < unitPrice) {
          tiers.push({
            minQuantity: Math.round(uni),
            pricePerUnit: ppu,
            label: `Display × ${Math.round(uni)}`,
          });
        }
      }
      // Display mayor (≥2 displays)
      if (pDisplayMay > 0 && uni > 0 && pDisplayMay !== pDisplayDet) {
        const ppu = Math.round(pDisplayMay / uni);
        const minQ = Math.round(uni) * 2;
        if (ppu < unitPrice && tiers.every((t) => t.minQuantity !== minQ)) {
          tiers.push({
            minQuantity: minQ,
            pricePerUnit: ppu,
            label: 'Display × mayor',
          });
        }
      }
      // Embalaje
      if (saleUnit.type !== 'embalaje' && pEmbalaje > 0 && totalEmbalaje > 0) {
        const ppu = Math.round(pEmbalaje / totalEmbalaje);
        if (ppu < unitPrice && tiers.every((t) => t.minQuantity !== totalEmbalaje)) {
          tiers.push({
            minQuantity: Math.round(totalEmbalaje),
            pricePerUnit: ppu,
            label: `Embalaje × ${Math.round(totalEmbalaje)}`,
          });
        }
      }

      // Upsert por barcode
      let product = await Product.findOne({ barcode });
      if (product) {
        product.name = name;
        product.description = description;
        product.categories = [categoryId];
        if (brandId) product.brand = brandId;
        product.provider = provider || undefined;
        product.unitPrice = unitPrice;
        product.saleUnit = saleUnit;
        product.tiers = tiers;
        product.active = true;
        if (userId) product.updatedBy = new mongoose.Types.ObjectId(userId);
        await product.save();
        report.productsUpdated += 1;
      } else {
        await Product.create({
          name,
          description,
          categories: [categoryId],
          brand: brandId,
          barcode,
          provider: provider || undefined,
          unitPrice,
          saleUnit,
          tiers,
          active: true,
          createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        });
        report.productsCreated += 1;
      }
    } catch (err: any) {
      report.errors.push({ row, barcode, message: err.message });
    }
  }

  report.durationMs = Date.now() - t0;
  return report;
}

function stratifiedSample(
  rows: Array<{ row: number; data: any[] }>,
  total: number
): Array<{ row: number; data: any[] }> {
  const byGroup = new Map<string, typeof rows>();
  for (const r of rows) {
    const g = norm(r.data[COL.GRUPO]) || 'OTROS';
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(r);
  }

  const totalRows = rows.length;
  const result: typeof rows = [];

  const quotas: Array<{ group: string; quota: number; available: number }> = [];
  for (const [group, list] of byGroup.entries()) {
    const quota = Math.round((total * list.length) / totalRows);
    quotas.push({ group, quota: Math.max(1, quota), available: list.length });
  }

  let sum = quotas.reduce((s, q) => s + Math.min(q.quota, q.available), 0);
  while (sum > total) {
    quotas.sort((a, b) => b.quota - a.quota);
    quotas[0].quota -= 1;
    sum = quotas.reduce((s, q) => s + Math.min(q.quota, q.available), 0);
  }
  while (sum < total) {
    quotas.sort((a, b) => (b.available - b.quota) - (a.available - a.quota));
    if (quotas[0].available <= quotas[0].quota) break;
    quotas[0].quota += 1;
    sum = quotas.reduce((s, q) => s + Math.min(q.quota, q.available), 0);
  }

  for (const { group, quota } of quotas) {
    const list = byGroup.get(group)!;
    result.push(...list.slice(0, Math.min(quota, list.length)));
  }
  return result;
}
