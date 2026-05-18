/**
 * Helper para `<img srcset>` con imágenes multi-size servidas por el backend.
 *
 * Backend genera variantes con sufijo `-w<N>` (ej. `abc-w400.webp`,
 * `abc-w800.webp`, `abc-w1200.webp`). Este helper detecta el sufijo en la
 * URL base, genera el `srcSet` con todos los anchos solicitados, y devuelve
 * además un `src` por defecto (la variante intermedia) para browsers que
 * no soporten srcset o cuando lazy-loading bloquea srcset.
 *
 * Si la URL no tiene sufijo `-w<N>` (imagen legacy single-size, o Cloudinary),
 * se devuelve solo `src` sin `srcSet` — funciona transparentemente.
 */

import { getImageUrl } from './images';

/** Anchos disponibles por tipo de imagen. Debe coincidir con FOLDER_WIDTHS del backend. */
export const SIZESET = {
  /** Cards de catálogo: productos, colecciones, categorías. */
  card:  [400, 800, 1200],
  /** Logos chicos: marcas, cart items. */
  thumb: [200, 400, 600],
  /** Hero full-width: banners, backgrounds. */
  hero:  [640, 1280, 1920],
} as const;

export type SrcsetResult = { src: string; srcSet?: string };

/**
 * Construye atributos `src` + `srcSet` desde una URL base con sufijo `-w<N>`.
 *
 * @param baseUrl  URL como viene de la DB. Puede ser:
 *                  - `/uploads/products/abc-w800.webp`  → multi-size moderno
 *                  - `/uploads/products/abc-processed.webp` → legacy single-size
 *                  - `https://res.cloudinary.com/...`   → URL externa
 *                  - vacío/null                          → placeholder
 * @param widths   Anchos disponibles para esta imagen (default: SIZESET.card)
 */
export function buildSrcSet(
  baseUrl: string | undefined | null,
  widths: readonly number[] = SIZESET.card
): SrcsetResult {
  if (!baseUrl) return { src: '/placeholder-product.svg' };

  const absoluteUrl = getImageUrl(baseUrl);
  if (!absoluteUrl) return { src: '/placeholder-product.svg' };

  // Detectar suffix -w<N>.<ext>
  const m = absoluteUrl.match(/^(.+)-w\d+(\.[a-z]+)$/i);
  if (!m) {
    // No es multi-size — devolver tal cual sin srcSet
    return { src: absoluteUrl };
  }

  const [, stem, ext] = m;
  const srcSet = widths.map((w) => `${stem}-w${w}${ext} ${w}w`).join(', ');
  return { src: absoluteUrl, srcSet };
}
