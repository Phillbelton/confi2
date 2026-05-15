'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';
import { buildSrcSet, SIZESET } from '@/lib/imageSrcset';
import { cn } from '@/lib/utils';
import type { Banner, BannerPlacement } from '@/types';

interface PromoGridProps {
  placement?: BannerPlacement;
  className?: string;
}

/**
 * Construye la URL del banner según el link estructurado.
 */
function resolveBannerHref(banner: Banner): string {
  const { type, target } = banner.link;
  if (!target || type === 'none') return '';
  switch (type) {
    case 'collection':
      return `/m/productos?coleccion=${target}`;
    case 'product':
      return `/m/productos/${target}`;
    case 'category':
      return `/m/productos?categoria=${target}`;
    case 'external':
      return target;
    default:
      return '';
  }
}

/**
 * Span CSS para cada tamaño de banner en el grid mosaico de desktop.
 */
function sizeClasses(size: Banner['size']): string {
  switch (size) {
    case 'wide':
      return 'lg:col-span-2 lg:row-span-1 aspect-[5/3] lg:aspect-[16/6]';
    case 'tall':
      return 'lg:col-span-1 lg:row-span-2 aspect-[5/3] lg:aspect-[4/5]';
    case 'hero':
      return 'lg:col-span-4 lg:row-span-2 aspect-[5/3] lg:aspect-[16/6]';
    case 'normal':
    default:
      return 'lg:col-span-1 lg:row-span-1 aspect-[5/3]';
  }
}

function BannerTile({ banner, className }: { banner: Banner; className?: string }) {
  const href = resolveBannerHref(banner);
  const isExternal = banner.link.type === 'external';
  const attrs = buildSrcSet(banner.image, SIZESET.hero);
  const mobileAttrs = banner.imageMobile
    ? buildSrcSet(banner.imageMobile, SIZESET.hero)
    : null;

  const content = (
    <div
      className={cn(
        'group relative h-full w-full overflow-hidden rounded-2xl shadow-md ring-1 ring-border/40 transition-transform hover:scale-[1.01] active:scale-[0.99]',
        href && 'cursor-pointer'
      )}
    >
      {/* Imagen mobile (si existe) — visible solo en mobile */}
      {mobileAttrs ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileAttrs.src}
            srcSet={mobileAttrs.srcSet}
            alt={banner.title || ''}
            sizes="100vw"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attrs.src}
            srcSet={attrs.srcSet}
            alt={banner.title || ''}
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 hidden h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:block"
          />
        </>
      ) : (
        // Una sola imagen para mobile + desktop
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={attrs.src}
          srcSet={attrs.srcSet}
          alt={banner.title || ''}
          sizes="(max-width: 1024px) 100vw, 50vw"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* Overlay legibilidad si hay texto */}
      {(banner.title || banner.subtitle) && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
          aria-hidden
        />
      )}

      {/* Texto + CTA */}
      {(banner.title || banner.subtitle || banner.ctaText) && (
        <div className="absolute inset-x-0 bottom-0 p-4 text-white lg:p-5">
          {banner.subtitle && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 lg:text-xs">
              {banner.subtitle}
            </p>
          )}
          {banner.title && (
            <h3 className="font-display text-lg font-bold leading-tight drop-shadow-md lg:text-2xl">
              {banner.title}
            </h3>
          )}
          {banner.ctaText && href && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-900 backdrop-blur transition group-hover:bg-white">
              {banner.ctaText}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={banner.title || 'Promoción'}
    >
      {content}
    </a>
  ) : (
    <Link
      href={href}
      className={className}
      aria-label={banner.title || 'Promoción'}
    >
      {content}
    </Link>
  );
}

export function PromoGrid({ placement = 'home_promo', className }: PromoGridProps) {
  const { data: banners, isLoading } = useBanners(placement);

  if (!isLoading && (!banners || banners.length === 0)) {
    return null; // sin banners — no renderizar la sección
  }

  return (
    <section className={cn('px-4 pb-8 lg:px-8', className)}>
      <div
        className={cn(
          // Mobile: 1 col stack
          'grid grid-cols-1 gap-3',
          // Desktop: mosaic 4 columnas, filas auto, items con span según size
          'lg:grid-cols-4 lg:auto-rows-[180px] lg:gap-4'
        )}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'animate-pulse rounded-2xl bg-muted',
                  i === 0
                    ? 'aspect-[5/3] lg:col-span-2 lg:row-span-2 lg:aspect-auto'
                    : 'aspect-[5/3] lg:col-span-1 lg:row-span-1 lg:aspect-auto'
                )}
              />
            ))
          : (banners || []).map((b) => (
              <BannerTile
                key={b._id}
                banner={b}
                className={sizeClasses(b.size)}
              />
            ))}
      </div>
    </section>
  );
}
