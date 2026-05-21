'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface BannerTileProps {
  banner: Banner;
  className?: string;
  /** Si true, prioriza la imagen (LCP) */
  priority?: boolean;
  /** sizes attribute para responsive — varía según contexto */
  sizes?: string;
  /** Si false, no aplica esquinas redondeadas/shadow/ring (full-bleed). */
  rounded?: boolean;
}

function BannerTile({ banner, className, priority, sizes, rounded = true }: BannerTileProps) {
  const href = resolveBannerHref(banner);
  const isExternal = banner.link.type === 'external';
  const attrs = buildSrcSet(banner.image, SIZESET.hero);
  const mobileAttrs = banner.imageMobile
    ? buildSrcSet(banner.imageMobile, SIZESET.hero)
    : null;
  const defaultSizes = sizes || '(max-width: 1024px) 100vw, 50vw';

  const content = (
    <div
      className={cn(
        'group relative h-full w-full overflow-hidden transition-transform',
        rounded && 'rounded-2xl shadow-md ring-1 ring-border/40',
        href && 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
      )}
    >
      {mobileAttrs ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileAttrs.src}
            srcSet={mobileAttrs.srcSet}
            alt={banner.title || ''}
            sizes="100vw"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attrs.src}
            srcSet={attrs.srcSet}
            alt={banner.title || ''}
            sizes={defaultSizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className="absolute inset-0 hidden h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:block"
          />
        </>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={attrs.src}
          srcSet={attrs.srcSet}
          alt={banner.title || ''}
          sizes={defaultSizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {(banner.title || banner.subtitle) && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
          aria-hidden
        />
      )}

      {(banner.title || banner.subtitle || banner.ctaText) && (
        <div className="absolute inset-x-0 bottom-0 p-4 text-white lg:p-6">
          {banner.subtitle && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 lg:text-xs">
              {banner.subtitle}
            </p>
          )}
          {banner.title && (
            <h3 className="font-display text-lg font-bold leading-tight drop-shadow-md lg:text-3xl">
              {banner.title}
            </h3>
          )}
          {banner.ctaText && href && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-900 backdrop-blur transition group-hover:bg-white lg:text-sm">
              {banner.ctaText}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );

  // `block h-full w-full` siempre: si className no setea display/dimensiones
  // (caso carrusel donde no se pasa className), el wrapper igual fills su slot
  // (Link/anchor default es inline → colapsaría a altura 0).
  const wrapperClass = cn('block h-full w-full', className);

  if (!href) {
    return <div className={wrapperClass}>{content}</div>;
  }

  return isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={wrapperClass}
      aria-label={banner.title || 'Promoción'}
    >
      {content}
    </a>
  ) : (
    <Link
      href={href}
      className={wrapperClass}
      aria-label={banner.title || 'Promoción'}
    >
      {content}
    </Link>
  );
}

/**
 * Carrusel para placement=home_hero: uno a la vez, auto-rotate cada 5s,
 * pausa al hover (desktop) o touch (mobile), dots de navegación.
 */
function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (total <= 1 || paused) return;
    intervalRef.current = setInterval(() => {
      setActive((i) => (i + 1) % total);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [total, paused]);

  if (total === 1) {
    return (
      <div className="aspect-[5/3] lg:aspect-[16/6]">
        <BannerTile banner={banners[0]} priority sizes="100vw" rounded={false} />
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
    >
      <div className="relative aspect-[5/3] overflow-hidden lg:aspect-[16/6]">
        {banners.map((b, i) => (
          <div
            key={b._id}
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              i === active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            )}
            aria-hidden={i !== active}
          >
            {/* priority en todas las slides del carrusel para precargar y
                evitar que las "ocultas" queden vacías al rotar (algunos browsers
                no cargan imágenes con opacity:0). */}
            <BannerTile banner={b} priority sizes="100vw" rounded={false} />
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      <button
        type="button"
        onClick={() => setActive((i) => (i - 1 + total) % total)}
        aria-label="Anterior"
        className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-gray-900 shadow-md backdrop-blur transition hover:scale-105 lg:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setActive((i) => (i + 1) % total)}
        aria-label="Siguiente"
        className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-gray-900 shadow-md backdrop-blur transition hover:scale-105 lg:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ir al banner ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function PromoGrid({ placement = 'home_promo', className }: PromoGridProps) {
  const { data: banners, isLoading } = useBanners(placement);

  if (!isLoading && (!banners || banners.length === 0)) {
    return null;
  }

  // Hero carrousel: placement=home_hero rota uno a la vez, full-bleed (sin
  // margen horizontal ni esquinas redondeadas — pegado al borde superior).
  if (placement === 'home_hero') {
    return (
      <section className={className}>
        {isLoading ? (
          <div className="aspect-[5/3] animate-pulse bg-muted lg:aspect-[16/6]" />
        ) : (
          <HeroCarousel banners={banners || []} />
        )}
      </section>
    );
  }

  // Grid uniforme — cada promoción en formato 5:3 (5 ancho × 3 alto)
  return (
    <section className={cn('px-4 pb-8 lg:px-8', className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[5/3] animate-pulse rounded-2xl bg-muted"
              />
            ))
          : (banners || []).map((b) => (
              <BannerTile
                key={b._id}
                banner={b}
                className="aspect-[5/3]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ))}
      </div>
    </section>
  );
}
