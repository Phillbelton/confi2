'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSafeImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import type { Collection } from '@/types';

interface CollectionCardProps {
  collection: Collection;
  className?: string;
  /** "square" → cuadrada (grid). "landscape" → 5:3 (carrusel doble fila). "row" → barra horizontal */
  variant?: 'square' | 'landscape' | 'row';
}

export function CollectionCard({
  collection,
  className,
  variant = 'square',
}: CollectionCardProps) {
  const href = `/m/productos?coleccion=${collection.slug}`;
  const gradient = collection.gradient || 'from-primary to-secondary';
  const hasImage = !!collection.image;
  const safeImage = hasImage
    ? getSafeImageUrl(collection.image, { width: 480, height: 360, quality: 'auto' })
    : null;

  const aspect =
    variant === 'square'
      ? 'aspect-square'
      : variant === 'landscape'
        ? 'aspect-[5/3]'
        : 'aspect-[16/6]';

  const titleSize =
    variant === 'square'
      ? 'text-sm'
      : variant === 'landscape'
        ? 'text-[13px]'
        : 'text-sm';

  const productCount =
    typeof collection.productCount === 'number'
      ? collection.productCount
      : Array.isArray(collection.products)
        ? collection.products.length
        : 0;

  return (
    <Link
      href={href}
      className={cn(
        'group relative block overflow-hidden rounded-2xl shadow-md ring-1 ring-border/40 transition-transform hover:scale-[1.02] active:scale-[0.98]',
        aspect,
        className
      )}
      aria-label={`Ver colección ${collection.name}`}
    >
      {/* Imagen o gradient fallback */}
      {hasImage ? (
        <Image
          src={safeImage!}
          alt={collection.name}
          fill
          sizes="(max-width: 640px) 70vw, 320px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 grid place-items-center bg-gradient-to-br',
            gradient
          )}
        >
          <span
            className={cn(
              'drop-shadow-lg',
              variant === 'landscape' ? 'text-5xl' : 'text-7xl'
            )}
            aria-hidden
          >
            {collection.emoji || '🎀'}
          </span>
        </div>
      )}

      {/* Overlay para legibilidad */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent',
          !hasImage && 'from-black/55'
        )}
        aria-hidden
      />

      {/* Badge emoji superior — solo cuando hay imagen */}
      {collection.emoji && hasImage && (
        <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-base shadow-md backdrop-blur">
          {collection.emoji}
        </span>
      )}

      {/* Badge contador productos */}
      {productCount > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
          {productCount}
        </span>
      )}

      {/* Contenido inferior */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        <h3
          className={cn(
            'line-clamp-1 font-display font-bold leading-tight drop-shadow',
            titleSize
          )}
        >
          {collection.name}
        </h3>
        {variant === 'square' && collection.description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/85">
            {collection.description}
          </p>
        )}
        <div
          className={cn(
            'mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-bold backdrop-blur',
            variant === 'landscape' ? 'text-[9px]' : 'text-[10px]'
          )}
        >
          Ver
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
