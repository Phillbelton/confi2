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
      <SectionHeader title="Colecciones" emoji="🎀" />

      {variant === 'double' ? (
        <>
          {/* Mobile: carrusel de 2 filas */}
          <div
            className={cn(
              'snap-x-mandatory overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:hidden',
              className
            )}
          >
            <div className="grid grid-flow-col grid-rows-2 auto-cols-[13rem] gap-3">
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

          {/* Desktop: grid landscape 5:3 — 2 cols lg, 3 cols xl */}
          <div
            className={cn(
              'hidden gap-4 px-8 pb-8 lg:grid lg:grid-cols-2 xl:grid-cols-3',
              className
            )}
          >
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[5/3] animate-pulse rounded-2xl bg-muted"
                  />
                ))
              : collections.map((c) => (
                  <CollectionCard key={c._id} collection={c} variant="landscape" />
                ))}
          </div>
        </>
      ) : variant === 'carousel' ? (
        <div
          className={cn(
            'snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:flex-wrap lg:justify-center lg:gap-4 lg:overflow-visible lg:px-8',
            className
          )}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[5/3] w-[15rem] lg:w-[18rem] shrink-0 animate-pulse rounded-2xl bg-muted"
                />
              ))
            : collections.map((c) => (
                <CollectionCard
                  key={c._id}
                  collection={c}
                  variant="landscape"
                  className="w-[15rem] lg:w-[18rem] shrink-0 snap-start"
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
