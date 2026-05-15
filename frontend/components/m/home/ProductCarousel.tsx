'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import type { Product } from '@/types';

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

/**
 * Vitrina de productos en scroll horizontal (igual mobile + desktop).
 * Desktop: agrega flechas de navegación a ambos lados.
 */
export function ProductCarousel({ products, isLoading }: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll por ~80% del ancho visible
    const delta = el.clientWidth * 0.8 * (dir === 'right' ? 1 : -1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:px-8 lg:gap-4">
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
    <div className="relative group/carousel">
      <div
        ref={scrollerRef}
        className="snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:px-8 lg:gap-4 lg:pb-6"
      >
        {products.map((p) => (
          <ProductCardM
            key={p._id}
            product={p}
            horizontal
            className="lg:w-56 lg:shrink-0"
          />
        ))}
      </div>

      {/* Flechas — solo desktop, aparecen al hover */}
      <button
        type="button"
        onClick={() => scrollBy('left')}
        aria-label="Anterior"
        className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white shadow-lg ring-1 ring-border opacity-0 transition-opacity hover:scale-105 group-hover/carousel:opacity-100 lg:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy('right')}
        aria-label="Siguiente"
        className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white shadow-lg ring-1 ring-border opacity-0 transition-opacity hover:scale-105 group-hover/carousel:opacity-100 lg:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
