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
import { invalidateAllTaxonomyCaches } from './taxonomyCache';
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

      // Determinar unitPrice y saleUnit.
      //
      // Heurística confitería (J = UNI por display, I = CAJAS por embalaje):
      //   J > 1   → producto se vende como DISPLAY (bolsa/paquete de J unidades)
      //   J = 1   → producto se vende como UNIDAD (botella, bandeja individual)
      //
      // unitPrice = precio de UNA cosa vendible (display o unidad).
      // Cae con cascada V → T → R/I → X según disponibilidad de precios.
      let unitPrice = 0;
      let saleUnit: { type: 'unidad' | 'display' | 'embalaje'; quantity: number } = {
        type: 'unidad',
        quantity: 1,
      };

      const uniInt = Math.max(1, Math.round(uni));
      const cajasInt = Math.max(1, Math.round(cajas));
      const isDisplay = uniInt > 1;

      // Precio de 1 display, derivado en orden de preferencia
      const displayPrice =
        pDisplayDet > 0
          ? pDisplayDet
          : pDisplayMay > 0
          ? pDisplayMay
          : pEmbalaje > 0 && cajasInt > 0
          ? Math.round(pEmbalaje / cajasInt)
          : 0;

      if (isDisplay) {
        if (displayPrice > 0) {
          unitPrice = Math.round(displayPrice);
          saleUnit = { type: 'display', quantity: uniInt };
        } else if (pEmbalaje > 0 && totalEmbalaje > 0) {
          unitPrice = Math.round(pEmbalaje / totalEmbalaje);
          saleUnit = { type: 'embalaje', quantity: Math.round(totalEmbalaje) };
        } else {
          report.errors.push({
            row,
            barcode,
            message: 'Producto display sin precios cargados (V/T/R todos en 0)',
          });
          continue;
        }
      } else {
        // J = 1 → unidad. Preferir X (col unitario) si existe, sino V (= precio
        // del "display" que en este caso es la unidad misma, ej. botella 2L).
        if (pUnit > 0) {
          unitPrice = Math.round(pUnit);
        } else if (displayPrice > 0) {
          unitPrice = Math.round(displayPrice);
        } else if (pEmbalaje > 0 && totalEmbalaje > 0) {
          unitPrice = Math.round(pEmbalaje / totalEmbalaje);
        } else {
          report.errors.push({
            row,
            barcode,
            message: 'Producto unidad sin precios cargados (X/V/T/R todos en 0)',
          });
          continue;
        }
        saleUnit = { type: 'unidad', quantity: 1 };
      }

      // Construir tiers: descuentos por volumen expresados como N × saleUnit.
      // Si saleUnit es display, el tier "comprando 2+ displays" usa precio mayorista.
      // Si saleUnit es unidad, los tiers usan los precios escalonados sobre unidades base.
      const tiers: Array<{ minQuantity: number; pricePerUnit: number; label?: string }> = [];

      if (saleUnit.type === 'display') {
        // Tier 1: precio mayorista del display (T < V) — comprando 2+ displays
        if (pDisplayMay > 0 && pDisplayMay < unitPrice) {
          tiers.push({
            minQuantity: 2,
            pricePerUnit: Math.round(pDisplayMay),
            label: 'Mayorista (2+ displays)',
          });
        }
        // Tier 2: caja completa (R/I = precio del display dentro de la caja)
        if (pEmbalaje > 0 && cajasInt > 0) {
          const ppuCaja = Math.round(pEmbalaje / cajasInt);
          if (ppuCaja < unitPrice && tiers.every((t) => t.minQuantity !== cajasInt)) {
            tiers.push({
              minQuantity: cajasInt,
              pricePerUnit: ppuCaja,
              label: `Caja completa (${cajasInt} displays)`,
            });
          }
        }
      } else {
        // saleUnit unidad: aplicar descuentos cuando se compran "displays" enteros
        // como múltiplos de unidades base (ej. botellas a precio mayorista o caja).
        if (pDisplayDet > 0 && pDisplayDet < unitPrice) {
          tiers.push({
            minQuantity: cajasInt > 1 ? cajasInt : 6,
            pricePerUnit: Math.round(pDisplayDet),
            label: 'Pack',
          });
        }
        if (pDisplayMay > 0 && pDisplayMay < unitPrice && pDisplayMay !== pDisplayDet) {
          const minQ = Math.max(2, cajasInt > 1 ? cajasInt * 2 : 12);
          if (tiers.every((t) => t.minQuantity !== minQ)) {
            tiers.push({
              minQuantity: minQ,
              pricePerUnit: Math.round(pDisplayMay),
              label: 'Mayorista',
            });
          }
        }
        if (pEmbalaje > 0 && totalEmbalaje > 0) {
          const ppu = Math.round(pEmbalaje / totalEmbalaje);
          if (ppu < unitPrice && tiers.every((t) => t.minQuantity !== totalEmbalaje)) {
            tiers.push({
              minQuantity: Math.round(totalEmbalaje),
              pricePerUnit: ppu,
              label: `Caja × ${Math.round(totalEmbalaje)}`,
            });
          }
        }
      }

      // Upsert por barcode
      let product = await Product.findOne({ barcode });
      if (product) {
        product.name = name;
        product.description = description;
        product.categories = [categoryId];
        if (brandId) product.brand = brandId;
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

  // Cualquier ruta de este import puede crear/borrar marcas, categorías,
  // formatos y sabores; el cache pierde todo coherencia tras la pasada.
  invalidateAllTaxonomyCaches();

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
