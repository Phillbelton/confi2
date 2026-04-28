'use client';

import { ProductCardM } from './ProductCardM';
import type { ProductParent } from '@/types';
import { cn } from '@/lib/utils';

interface ProductGridMProps {
  products: ProductParent[];
  isLoading?: boolean;
  className?: string;
}

export function ProductGridM({ products, isLoading, className }: ProductGridMProps) {
  if (isLoading && products.length === 0) {
    return (
      <div
        className={cn(
          'grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[260px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <span className="text-4xl" aria-hidden>🍭</span>
        <p className="font-display text-base font-bold">No encontramos productos</p>
        <p className="text-sm text-muted-foreground">
          Probá quitando algún filtro o cambiando la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        className
      )}
    >
      {products.map((p) => (
        <ProductCardM key={p._id} product={p} autoFetchVariants />
      ))}
    </div>
  );
}
