'use client';

import { useHomeCollections } from '@/hooks/useCollections';
import { SectionHeader } from './SectionHeader';
import { CollectionCard } from './CollectionCard';
import { cn } from '@/lib/utils';
import type { Collection } from '@/types';

interface CollectionsGridProps {
  className?: string;
  /** Layout — "grid" tradicional, "carousel" 1 fila snap, "double" 2 filas snap horizontal */
  variant?: 'grid' | 'carousel' | 'double';
}

export function CollectionsGrid({
  className,
  variant = 'double',
}: CollectionsGridProps) {
  const { data, isLoading } = useHomeCollections();
  const collections = (data as Collection[] | undefined) || [];

  // No renderizar la sección si no hay colecciones
  if (!isLoading && collections.length === 0) {
    return null;
  }

  return (
    <>
      <SectionHeader
        title="Colecciones"
        subtitle="Listas curadas para cada ocasión"
        emoji="🎀"
      />

      {variant === 'double' ? (
        // Carrusel de 2 filas — grid-flow-col arma columnas que fluyen horizontalmente
        <div
          className={cn(
            'snap-x-mandatory overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none',
            className
          )}
        >
          <div className="grid grid-flow-col grid-rows-2 auto-cols-[10rem] gap-3">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[5/3] animate-pulse rounded-2xl bg-muted"
                  />
                ))
              : collections.map((c) => (
                  <CollectionCard
                    key={c._id}
                    collection={c}
                    variant="landscape"
                    className="snap-start"
                  />
                ))}
          </div>
        </div>
      ) : variant === 'carousel' ? (
        <div
          className={cn(
            'snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none',
            className
          )}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square w-44 shrink-0 animate-pulse rounded-3xl bg-muted"
                />
              ))
            : collections.map((c) => (
                <CollectionCard
                  key={c._id}
                  collection={c}
                  variant="square"
                  className="w-44 shrink-0 snap-start"
                />
              ))}
        </div>
      ) : (
        // Grid clásico
        <div
          className={cn(
            'grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3 md:grid-cols-4',
            className
          )}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-3xl bg-muted"
                />
              ))
            : collections.map((c) => (
                <CollectionCard key={c._id} collection={c} variant="square" />
              ))}
        </div>
      )}
    </>
  );
}
