'use client';

import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import type { Product } from '@/types';

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

/**
 * Vitrina de productos.
 * - Mobile: scroll horizontal con snap.
 * - Desktop (lg+): grid 4 cols / xl 5 cols (estilo Jumbo).
 */
export function ProductCarousel({ products, isLoading }: ProductCarouselProps) {
  if (isLoading) {
    return (
      <>
        {/* Mobile carousel skeleton */}
        <div className="snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[268px] w-44 shrink-0 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
        {/* Desktop grid skeleton */}
        <div className="hidden gap-4 px-8 pb-6 lg:grid lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      </>
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
    <>
      {/* Mobile: scroll horizontal */}
      <div className="snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:hidden">
        {products.map((p) => (
          <ProductCardM key={p._id} product={p} horizontal />
        ))}
      </div>
      {/* Desktop: grid */}
      <div className="hidden gap-4 px-8 pb-6 lg:grid lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => (
          <ProductCardM key={p._id} product={p} />
        ))}
      </div>
    </>
  );
}
