/**
 * Cache en memoria de las cuatro taxonomías (Brand, Category, Format, Flavor)
 * que se popula sobre cada producto en `productController`. Estas colecciones
 * son chicas (decenas de docs), cambian poco, y se leen en cada listado de
 * catálogo — el caso de libro para un cache en proceso.
 *
 * Reemplaza los `.populate('brand'|'categories'|'format'|'flavor', ...)` por
 * un join en memoria contra estos mapas, eliminando 4 round-trips por
 * request al storefront público.
 *
 * Características:
 *  - Lazy load: la primera lectura dispara el fetch; las siguientes leen RAM.
 *  - TTL safety net (5 min): si una invalidación se escapa (ej. nuevo endpoint
 *    admin sin wiring), el cache se refresca solo dentro del minuto siguiente.
 *  - In-flight dedup: si N requests piden el mapa simultáneamente con cache
 *    vacío, solo uno hace la query a Mongo; los demás esperan la misma
 *    promesa. Previene thundering herd al boot o post-invalidación.
 *  - Invalidación granular: cuatro `invalidate*Cache()` exportados que deben
 *    llamarse desde los controllers admin después de cualquier escritura.
 *  - Stats opcionales: hits/misses por colección, exposable como /api/health.
 *
 * Limitación conocida: single-instance. Si se escala a multi-nodo detrás de
 * un load balancer, cada proceso tiene su propia copia y la invalidación
 * solo afecta al nodo que recibió la mutación. Mitigado por el TTL corto;
 * cuando llegue ese momento, migrar a Redis pub/sub.
 */

import mongoose from 'mongoose';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { Format } from '../models/Format';
import { Flavor } from '../models/Flavor';
import logger from '../config/logger';

// ───────────────────────────────────────────────────────────────────────
// Tipos
// ───────────────────────────────────────────────────────────────────────

/** Subset de campos que pueden necesitar los endpoints públicos de Product. */
export interface CachedBrand {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  active: boolean;
}

export interface CachedCategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  parent?: mongoose.Types.ObjectId | null;
  active: boolean;
}

export interface CachedFormat {
  _id: mongoose.Types.ObjectId;
  label: string;
  value: number;
  unit: string;
  slug: string;
  active: boolean;
}

export interface CachedFlavor {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  color?: string;
  active: boolean;
}

export type TaxonomyName = 'brands' | 'categories' | 'formats' | 'flavors';

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  /** Timestamp ms del último refresh, o null si no hubo. */
  loadedAt: number | null;
  /** Timestamp ms en que expira el snapshot actual, o null si no hay. */
  expiresAt: number | null;
}

// ───────────────────────────────────────────────────────────────────────
// Configuración
// ───────────────────────────────────────────────────────────────────────

/**
 * TTL de seguridad. Si el cache nunca expirara, un bug de invalidación
 * (ruta admin nueva que olvida llamar invalidate*) dejaría datos viejos
 * para siempre. 5 min es un compromiso: corto para limitar el daño, largo
 * para que el cache valga la pena en tráfico normal.
 */
export const CACHE_TTL_MS = 5 * 60 * 1000;

// ───────────────────────────────────────────────────────────────────────
// Estado interno
// ───────────────────────────────────────────────────────────────────────

interface CacheSlot<T> {
  data: ReadonlyMap<string, T> | null;
  expiresAt: number;
  /** Promesa en vuelo, para deduplicar fetches concurrentes. */
  inflight: Promise<ReadonlyMap<string, T>> | null;
  hits: number;
  misses: number;
  loadedAt: number | null;
}

const brandsSlot: CacheSlot<CachedBrand> = {
  data: null,
  expiresAt: 0,
  inflight: null,
  hits: 0,
  misses: 0,
  loadedAt: null,
};
const categoriesSlot: CacheSlot<CachedCategory> = {
  data: null,
  expiresAt: 0,
  inflight: null,
  hits: 0,
  misses: 0,
  loadedAt: null,
};
const formatsSlot: CacheSlot<CachedFormat> = {
  data: null,
  expiresAt: 0,
  inflight: null,
  hits: 0,
  misses: 0,
  loadedAt: null,
};
const flavorsSlot: CacheSlot<CachedFlavor> = {
  data: null,
  expiresAt: 0,
  inflight: null,
  hits: 0,
  misses: 0,
  loadedAt: null,
};

// ───────────────────────────────────────────────────────────────────────
// Core: getOrLoad
// ───────────────────────────────────────────────────────────────────────

async function getOrLoad<T extends { _id: mongoose.Types.ObjectId }>(
  slot: CacheSlot<T>,
  loader: () => Promise<T[]>,
  name: TaxonomyName
): Promise<ReadonlyMap<string, T>> {
  const now = Date.now();

  if (slot.data !== null && slot.expiresAt > now) {
    slot.hits++;
    return slot.data;
  }

  // Si hay un fetch en vuelo, todos los callers concurrentes lo comparten
  // y evitamos que N requests dupliquen el query a Mongo.
  if (slot.inflight !== null) {
    return slot.inflight;
  }

  slot.misses++;

  slot.inflight = (async () => {
    try {
      const docs = await loader();
      const map = new Map<string, T>();
      for (const doc of docs) {
        map.set(doc._id.toString(), doc);
      }
      const frozen: ReadonlyMap<string, T> = map;
      slot.data = frozen;
      slot.expiresAt = Date.now() + CACHE_TTL_MS;
      slot.loadedAt = Date.now();
      return frozen;
    } catch (err) {
      // No envenenamos el cache con vacío; el próximo caller reintenta.
      slot.data = null;
      slot.expiresAt = 0;
      slot.loadedAt = null;
      logger.error(`[taxonomyCache] Falló carga de ${name}`, {
        err: (err as Error).message,
      });
      throw err;
    } finally {
      slot.inflight = null;
    }
  })();

  return slot.inflight;
}

// ───────────────────────────────────────────────────────────────────────
// Loaders por colección
// ───────────────────────────────────────────────────────────────────────

/**
 * Cargamos TODOS los docs (activos e inactivos). Mongoose `populate` no
 * filtra por `active` por defecto y los productos pueden seguir
 * referenciando una marca soft-deleted; mantenemos la misma semántica.
 */

async function loadBrands(): Promise<CachedBrand[]> {
  return Brand.find({})
    .select('_id name slug logo active')
    .lean<CachedBrand[]>()
    .exec();
}

async function loadCategories(): Promise<CachedCategory[]> {
  return Category.find({})
    .select('_id name slug color icon parent active')
    .lean<CachedCategory[]>()
    .exec();
}

async function loadFormats(): Promise<CachedFormat[]> {
  return Format.find({})
    .select('_id label value unit slug active')
    .lean<CachedFormat[]>()
    .exec();
}

async function loadFlavors(): Promise<CachedFlavor[]> {
  return Flavor.find({})
    .select('_id name slug color active')
    .lean<CachedFlavor[]>()
    .exec();
}

// ───────────────────────────────────────────────────────────────────────
// API pública: getters
// ───────────────────────────────────────────────────────────────────────

export const getBrandsMap = (): Promise<ReadonlyMap<string, CachedBrand>> =>
  getOrLoad(brandsSlot, loadBrands, 'brands');

export const getCategoriesMap = (): Promise<
  ReadonlyMap<string, CachedCategory>
> => getOrLoad(categoriesSlot, loadCategories, 'categories');

export const getFormatsMap = (): Promise<ReadonlyMap<string, CachedFormat>> =>
  getOrLoad(formatsSlot, loadFormats, 'formats');

export const getFlavorsMap = (): Promise<ReadonlyMap<string, CachedFlavor>> =>
  getOrLoad(flavorsSlot, loadFlavors, 'flavors');

/**
 * Conveniencia: precarga las 4 colecciones en paralelo. Útil al boot del
 * server o post-deploy para dejar el cache caliente antes del primer request.
 */
export const warmTaxonomyCache = async (): Promise<void> => {
  await Promise.all([
    getBrandsMap(),
    getCategoriesMap(),
    getFormatsMap(),
    getFlavorsMap(),
  ]);
};

// ───────────────────────────────────────────────────────────────────────
// API pública: invalidación
// ───────────────────────────────────────────────────────────────────────

const invalidateSlot = <T>(slot: CacheSlot<T>): void => {
  slot.data = null;
  slot.expiresAt = 0;
  slot.loadedAt = null;
  // Nota: NO cancelamos `inflight`. Si hay un fetch en vuelo, lo dejamos
  // terminar — el resultado popula el cache, pero la próxima invocación
  // ya verá data=null y disparará un nuevo fetch porque expiresAt=0.
};

export const invalidateBrandsCache = (): void => invalidateSlot(brandsSlot);
export const invalidateCategoriesCache = (): void =>
  invalidateSlot(categoriesSlot);
export const invalidateFormatsCache = (): void => invalidateSlot(formatsSlot);
export const invalidateFlavorsCache = (): void => invalidateSlot(flavorsSlot);

export const invalidateAllTaxonomyCaches = (): void => {
  invalidateBrandsCache();
  invalidateCategoriesCache();
  invalidateFormatsCache();
  invalidateFlavorsCache();
};

// ───────────────────────────────────────────────────────────────────────
// Diagnóstico
// ───────────────────────────────────────────────────────────────────────

const toStats = <T>(slot: CacheSlot<T>): CacheStats => ({
  hits: slot.hits,
  misses: slot.misses,
  size: slot.data?.size ?? 0,
  loadedAt: slot.loadedAt,
  expiresAt: slot.expiresAt > 0 ? slot.expiresAt : null,
});

export const getTaxonomyCacheStats = (): Record<TaxonomyName, CacheStats> => ({
  brands: toStats(brandsSlot),
  categories: toStats(categoriesSlot),
  formats: toStats(formatsSlot),
  flavors: toStats(flavorsSlot),
});

// ───────────────────────────────────────────────────────────────────────
// Helpers de hidratación (usados por productController)
// ───────────────────────────────────────────────────────────────────────

type AnyId = mongoose.Types.ObjectId | string | null | undefined;

const idToKey = (id: AnyId): string | null => {
  if (id == null) return null;
  return typeof id === 'string' ? id : id.toString();
};

/**
 * Proyecta un subdoc cacheado a los campos pedidos (más `_id`). Devuelve
 * `null` si el doc no está en cache (ref colgada, semántica de populate).
 */
export const pickFields = <T extends { _id: mongoose.Types.ObjectId }>(
  doc: T | undefined,
  fields: ReadonlyArray<keyof T>
): (Pick<T, keyof T> & { _id: mongoose.Types.ObjectId }) | null => {
  if (!doc) return null;
  const out = { _id: doc._id } as Pick<T, keyof T> & {
    _id: mongoose.Types.ObjectId;
  };
  for (const f of fields) {
    const v = doc[f];
    if (v !== undefined) {
      (out as Record<string, unknown>)[f as string] = v;
    }
  }
  return out;
};

/**
 * Hidrata una referencia 1:1 (brand, format, flavor) sobre un objeto
 * producto lean. Reemplaza in-place el campo `key` por el subdoc proyectado
 * o `null` si la ref está colgada, replicando el comportamiento de
 * `Mongoose.populate()`.
 */
export const hydrateRef = <
  P extends Record<string, unknown>,
  T extends { _id: mongoose.Types.ObjectId },
>(
  product: P,
  key: keyof P & string,
  map: ReadonlyMap<string, T>,
  fields: ReadonlyArray<keyof T>
): void => {
  const refId = idToKey(product[key] as AnyId);
  if (refId === null) {
    return; // ref ausente: dejamos el campo como vino (null/undefined/ObjectId).
  }
  const subdoc = map.get(refId);
  (product as Record<string, unknown>)[key] = pickFields(subdoc, fields);
};

/**
 * Hidrata una referencia 1:N (categories es array de ObjectId). Reemplaza
 * el array por subdocs proyectados; los IDs no encontrados se omiten (la
 * semántica de populate Mongoose con array preserva ranuras null, pero
 * para el storefront es preferible no enviar nulls — el frontend no los
 * espera y los filtra igual).
 */
export const hydrateRefArray = <
  P extends Record<string, unknown>,
  T extends { _id: mongoose.Types.ObjectId },
>(
  product: P,
  key: keyof P & string,
  map: ReadonlyMap<string, T>,
  fields: ReadonlyArray<keyof T>
): void => {
  const rawArr = product[key];
  if (!Array.isArray(rawArr)) {
    return;
  }
  const hydrated: Array<Pick<T, keyof T> & { _id: mongoose.Types.ObjectId }> =
    [];
  for (const id of rawArr) {
    const refId = idToKey(id as AnyId);
    if (refId === null) continue;
    const subdoc = map.get(refId);
    const picked = pickFields(subdoc, fields);
    if (picked !== null) hydrated.push(picked);
  }
  (product as Record<string, unknown>)[key] = hydrated;
};
