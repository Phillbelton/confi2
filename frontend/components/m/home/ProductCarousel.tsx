'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

/**
 * Vitrina horizontal de productos basada en embla-carousel.
 * - Touch: scroll nativo arrastrable.
 * - Mouse: drag-to-scroll desde cualquier parte de la card (incluida la
 *   imagen). Embla diferencia drag vs click sin bloquear botones.
 * - Desktop: flechas opcionales para los usuarios que prefieren clic.
 */
export function ProductCarousel({ products, isLoading }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
    skipSnaps: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('scroll', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('scroll', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden px-4 pb-4 lg:px-8 lg:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[268px] w-44 shrink-0 animate-pulse rounded-2xl bg-muted lg:h-[340px] lg:w-56"
          />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="px-4 pb-2 text-sm text-muted-foreground lg:px-8">
        No hay productos disponibles.
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden px-4 pb-4 lg:px-8 lg:pb-6">
        <div className="flex gap-3 lg:gap-4 touch-pan-y">
          {products.map((p) => (
            <div key={p._id} className="shrink-0 w-44 lg:w-56">
              <ProductCardM product={p} horizontal />
            </div>
          ))}
        </div>
      </div>

      {/* Flechas (solo desktop) — opcionales, no requeridas para usar el carrusel */}
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        className={cn(
          'hidden lg:grid absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 place-items-center',
          'rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-opacity',
          'hover:bg-background disabled:opacity-0 disabled:pointer-events-none'
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        className={cn(
          'hidden lg:grid absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 place-items-center',
          'rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-opacity',
          'hover:bg-background disabled:opacity-0 disabled:pointer-events-none'
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
