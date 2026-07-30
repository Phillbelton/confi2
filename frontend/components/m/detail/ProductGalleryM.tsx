'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { buildSrcSet, SIZESET } from '@/lib/imageSrcset';
import { cn } from '@/lib/utils';

interface ProductGalleryMProps {
  images: string[];
  alt: string;
  /** Overlays de la ficha (badge de oferta, badge de presentación). */
  children?: ReactNode;
}

/**
 * Galería de la ficha de producto.
 *
 * Decisiones que la diferencian del cuadrado gigante anterior:
 *
 * - **Alto acotado por viewport** (`min(42vh,340px)` móvil / `min(58vh,480px)`
 *   desktop) en vez de `aspect-square` sobre una columna del 55%: ahí la imagen
 *   medía 699×699 en 1440×900 (78% del alto de pantalla) y empujaba precio,
 *   presentaciones y CTA fuera de la primera pantalla. Al ser alto FIJO (no
 *   ratio) no hay CLS y sirve igual para fotos horizontales y verticales.
 * - **`object-contain`**, no `cover`: las fotos de producto son de estudio y
 *   `cover` recortaba ~29% del ancho en las horizontales, además de ampliarlas
 *   2× (borrosas). Acá se ven completas, con padding.
 * - **Placeholder compacto** cuando no hay fotos. Es el caso dominante del
 *   catálogo real (casi ningún producto tiene imagen todavía): ocupar media
 *   pantalla con un emoji era puro costo.
 * - **Swipe nativo + dots** en el scroller (scroll-snap, corre en el
 *   compositor), miniaturas sincronizadas en ambos sentidos, y ← → con foco.
 */
export function ProductGalleryM({ images, alt, children }: ProductGalleryMProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images.length > 0;
  const multi = images.length > 1;

  // El índice activo lo dicta la posición de scroll (fuente única): así el
  // swipe, el click en miniatura y las flechas convergen al mismo estado.
  const syncFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex((prev) => (idx !== prev ? idx : prev));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        syncFromScroll();
        ticking = false;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [syncFromScroll]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(i, images.length - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setActiveIndex(clamped);
  };

  // Sin fotos: bloque bajo y discreto, no un cuadrado a pantalla completa.
  if (!hasImages) {
    return (
      <div className="px-4 pt-3 lg:px-0 lg:pt-0">
        <div className="relative grid h-24 place-items-center gap-1 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 lg:h-40">
          <span className="text-3xl lg:text-5xl" aria-hidden>
            🍭
          </span>
          <p className="text-[11px] text-muted-foreground lg:text-xs">Foto no disponible</p>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollerRef}
          onKeyDown={(e) => {
            if (!multi) return;
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              goTo(activeIndex + 1);
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              goTo(activeIndex - 1);
            }
          }}
          tabIndex={multi ? 0 : -1}
          role={multi ? 'group' : undefined}
          aria-label={multi ? `Fotos de ${alt}` : undefined}
          className={cn(
            'snap-x-mandatory flex overflow-x-auto scrollbar-none bg-muted/40',
            'h-[min(42vh,340px)] lg:h-[min(58vh,480px)]',
            'lg:rounded-2xl lg:border lg:border-border',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
        >
          {images.map((src, i) => {
            const attrs = buildSrcSet(src, SIZESET.card);
            return (
              <div key={`${src}-${i}`} className="relative h-full w-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attrs.src}
                  srcSet={attrs.srcSet}
                  alt={images.length > 1 ? `${alt} — foto ${i + 1}` : alt}
                  // Coincide con el alto real del frame, no con el ancho de la
                  // columna: pedir 55vw bajaba una variante más grande que la
                  // que se llega a mostrar.
                  sizes="(max-width: 1023px) 100vw, 480px"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="absolute inset-0 h-full w-full select-none object-contain p-3 lg:p-6"
                />
              </div>
            );
          })}
        </div>

        {children}

        {multi && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === activeIndex ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/30'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {multi && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none lg:px-0">
          {images.map((img, i) => {
            // `card`, no `thumb`: las imágenes de producto solo existen en
            // w400/w800/w1200 — un srcset con w200/w600 es 404 en local.
            const thumb = buildSrcSet(img, SIZESET.card);
            const isActive = i === activeIndex;
            return (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-pressed={isActive}
                className={cn(
                  'relative aspect-square h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-muted/40 transition-colors',
                  isActive ? 'border-primary' : 'border-transparent hover:border-border'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb.src}
                  srcSet={thumb.srcSet}
                  alt=""
                  sizes="64px"
                  className="absolute inset-0 h-full w-full object-contain p-1"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
