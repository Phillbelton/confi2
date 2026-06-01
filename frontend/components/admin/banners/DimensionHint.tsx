'use client';

import { cn } from '@/lib/utils';
import type { BannerPlacement } from '@/types';

/**
 * Especificación de tamaño ideal de imagen para una sección/franja.
 * `w`/`h` son la proporción (para dibujar la cajita); `px` el tamaño sugerido.
 */
export interface ImageSpec {
  ratioLabel: string;
  px: string;
  w: number;
  h: number;
}

/**
 * Tamaño ideal por imagen según cuántas columnas tenga la franja.
 * Las proporciones replican exactamente el render público (ASPECT_LG en
 * PromoGrid): menos columnas → imagen más panorámica.
 */
export function recommendedForCols(cols: number): ImageSpec {
  switch (cols) {
    case 1:
      return { ratioLabel: '16:5', px: '1600 × 500', w: 16, h: 5 };
    case 2:
      return { ratioLabel: '2:1', px: '1200 × 600', w: 2, h: 1 };
    case 3:
      return { ratioLabel: '16:9', px: '1280 × 720', w: 16, h: 9 };
    case 4:
    default:
      return { ratioLabel: '5:3', px: '1000 × 600', w: 5, h: 3 };
  }
}

/** Hero — carrusel full-width (lg:aspect-[16/6]). */
export const HERO_SPEC: ImageSpec = { ratioLabel: '16:6', px: '1920 × 720', w: 16, h: 6 };

/** Colecciones — card landscape (aspect-[5/3]). */
export const COLLECTION_SPEC: ImageSpec = { ratioLabel: '5:3', px: '1000 × 600', w: 5, h: 3 };

/** Banner ancho de cabecera (top de categoría/colección). */
export const WIDE_TOP_SPEC: ImageSpec = { ratioLabel: '16:5', px: '1600 × 500', w: 16, h: 5 };

/**
 * Tamaño ideal según el placement del banner. Para los placements de franja
 * (home_promo / home_secondary) depende de las columnas de la franja.
 */
export function specForPlacement(
  placement: BannerPlacement,
  cols?: number
): ImageSpec {
  switch (placement) {
    case 'home_hero':
      return HERO_SPEC;
    case 'home_promo':
    case 'home_secondary':
      return recommendedForCols(cols ?? 1);
    case 'category_top':
    case 'collection_top':
    default:
      return WIDE_TOP_SPEC;
  }
}

const BOX_W = 46;

/**
 * Describe gráficamente la dimensión ideal: una cajita con la proporción real
 * (ancho fijo, alto proporcional) + el ratio + el tamaño en px sugerido.
 */
export function DimensionHint({ spec, className }: { spec: ImageSpec; className?: string }) {
  const boxH = Math.round((BOX_W * spec.h) / spec.w);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] text-muted-foreground',
        className
      )}
    >
      <span
        className="block shrink-0 rounded-[2px] border border-muted-foreground/40 bg-muted-foreground/10"
        style={{ width: BOX_W, height: boxH }}
        aria-hidden
      />
      <span>
        <strong className="font-semibold text-foreground">{spec.ratioLabel}</strong>
        {' · ~'}
        {spec.px} px
      </span>
    </span>
  );
}

export default DimensionHint;
