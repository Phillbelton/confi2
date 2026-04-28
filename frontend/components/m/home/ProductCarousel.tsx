'use client';

import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import type { ProductParent } from '@/types';

interface ProductCarouselProps {
  products: ProductParent[];
  isLoading?: boolean;
}

export function ProductCarousel({ products, isLoading }: ProductCarouselProps) {
  if (isLoading) {
    return (
      <div className="snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[268px] w-44 shrink-0 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="px-4 pb-2 text-sm text-muted-foreground">
        No hay productos disponibles.
      </div>
    );
  }

  return (
    <div className="snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none">
      {products.map((p) => (
        <ProductCardM key={p._id} product={p} autoFetchVariants horizontal />
      ))}
    </div>
  );
}
