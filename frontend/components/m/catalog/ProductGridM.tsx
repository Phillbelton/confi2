'use client';

import { ProductCardM } from './ProductCardM';
import { EmptyState } from '@/components/m/EmptyState';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductGridMProps {
  products: Product[];
  isLoading?: boolean;
  className?: string;
}

export function ProductGridM({ products, isLoading, className }: ProductGridMProps) {
  if (isLoading && products.length === 0) {
    return (
      <div
        className={cn(
          'grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:gap-4 lg:px-8 md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]',
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
      <EmptyState
        emoji="🍭"
        title="No encontramos productos"
        description="Prueba quitando algún filtro o cambiando lo que buscas. ¡Seguro tenemos algo dulce para ti!"
        action={{ label: 'Ver todo el catálogo', href: '/productos' }}
      />
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:gap-4 lg:px-8 md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]',
        className
      )}
    >
      {products.map((p) => (
        <ProductCardM key={p._id} product={p} />
      ))}
    </div>
  );
}
