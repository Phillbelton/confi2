'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
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
      return `/productos?coleccion=${target}`;
    case 'product':
      return `/productos/${target}`;
    case 'category':
      return `/productos?categoria=${target}`;
    case 'external':
      return target;
    default:
      return '';
  }
}

/**
 * Franjas (rows): los banners de un placement de mosaico se agrupan por
 * `rowOrder`. Cada franja muestra `cols` banners en línea en desktop, y en mobile
 * los apila (stack) o los hace scroll horizontal (scroll).
 */
type Row = { cols: number; mobileMode: Banner['mobileMode']; banners: Banner[] };

function groupIntoRows(banners: Banner[]): Row[] {
  const map = new Map<number, Banner[]>();
  for (const b of banners) {
    const key = b.rowOrder ?? 0;
    const arr = map.get(key);
    if (arr) arr.push(b);
    else map.set(key, [b]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, arr]) => {
      const sorted = [...arr].sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
      const first = sorted[0];
      return {
        cols: first?.cols ?? 1,
        mobileMode: first?.mobileMode ?? 'stack',
        banners: sorted,
      };
    });
}

// Clases estáticas (Tailwind no purga clases construidas en runtime).
const COLS_LG: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

// Aspect ratio del tile en desktop según cuántas columnas tenga la franja:
// menos columnas → tiles más anchos/panorámicos.
const ASPECT_LG: Record<number, string> = {
  1: 'lg:aspect-[16/5]',
  2: 'lg:aspect-[2/1]',
  3: 'lg:aspect-[16/9]',
  4: 'lg:aspect-[5/3]',
};

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
 * Carrusel para placement=home_hero: track deslizable de un banner a la vez.
 * Auto-rotate cada 5s (pausa al hover, al arrastrar o tras interactuar),
 * arrastrable con dedo o mouse, flechas en desktop y dots de navegación.
 */
function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado de arrastre
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<'h' | 'v' | null>(null);
  const moved = useRef(false);
  const [dragDX, setDragDX] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (total <= 1 || paused || dragging) return;
    intervalRef.current = setInterval(() => {
      setActive((i) => (i + 1) % total);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [total, paused, dragging]);

  if (total === 1) {
    return (
      <div className="aspect-[16/9] overflow-hidden rounded-2xl shadow-md ring-1 ring-border/40 lg:aspect-[16/6] lg:rounded-none lg:shadow-none lg:ring-0">
        <BannerTile banner={banners[0]} priority sizes="100vw" rounded={false} />
      </div>
    );
  }

  const goTo = (i: number) => setActive((i + total) % total);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
    axis.current = null;
    moved.current = false;
    setDragging(true);
    setPaused(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // Decidir el eje del gesto la primera vez que se supera el umbral
    if (axis.current === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (axis.current === 'h') {
        viewportRef.current?.setPointerCapture(e.pointerId);
      }
    }
    if (axis.current === 'h') {
      moved.current = true;
      // Resistencia al arrastrar más allá del primer/último banner
      const overscroll =
        (active === 0 && dx > 0) || (active === total - 1 && dx < 0);
      setDragDX(overscroll ? dx * 0.35 : dx);
    }
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const wasHorizontal = axis.current === 'h';
    dragStart.current = null;
    axis.current = null;
    setDragging(false);
    setDragDX(0);
    window.setTimeout(() => setPaused(false), 3000);

    // Avanza o retrocede según la dirección del arrastre si supera el umbral
    const width = viewportRef.current?.offsetWidth || 1;
    const threshold = Math.min(72, width * 0.18);
    if (wasHorizontal && Math.abs(dx) > threshold) {
      goTo(active + (dx < 0 ? 1 : -1));
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={viewportRef}
        className="relative aspect-[16/9] cursor-grab touch-pan-y select-none overflow-hidden rounded-2xl shadow-md ring-1 ring-border/40 active:cursor-grabbing lg:aspect-[16/6] lg:rounded-none lg:shadow-none lg:ring-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          // Si hubo arrastre, anular el click para no navegar al banner
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
      >
        <div
          className={cn(
            'flex h-full',
            !dragging && 'transition-transform duration-500 ease-out'
          )}
          style={{
            transform: `translateX(calc(${-active * 100}% + ${dragDX}px))`,
          }}
        >
          {banners.map((b, i) => (
            <div
              key={b._id}
              className="h-full w-full shrink-0"
              aria-hidden={i !== active}
            >
              <BannerTile banner={b} priority sizes="100vw" rounded={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next */}
      <button
        type="button"
        onClick={() => goTo(active - 1)}
        aria-label="Anterior"
        className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-gray-900 shadow-md backdrop-blur transition hover:scale-105 lg:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(active + 1)}
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
            onClick={() => goTo(i)}
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
          <div className="aspect-[16/9] animate-pulse rounded-2xl bg-muted lg:aspect-[16/6] lg:rounded-none" />
        ) : (
          <HeroCarousel banners={banners || []} />
        )}
      </section>
    );
  }

  // Mosaic por franjas para los demás placements
  if (isLoading) {
    return (
      <section className={cn('px-4 pb-8 lg:px-8', className)}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[5/3] animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  const rows = groupIntoRows(banners || []);

  return (
    <section className={cn('space-y-3 px-4 pb-8 lg:space-y-4 lg:px-8', className)}>
      {rows.map((row, i) => (
        <PromoRow key={i} row={row} />
      ))}
    </section>
  );
}

/**
 * Una franja: `cols` banners en línea en desktop. En mobile, los apila
 * (mobileMode=stack) o los muestra en scroll horizontal (mobileMode=scroll).
 */
function PromoRow({ row }: { row: Row }) {
  const cols = (COLS_LG[row.cols] ? row.cols : 1) as 1 | 2 | 3 | 4;
  const aspectLg = ASPECT_LG[cols];

  if (row.mobileMode === 'scroll') {
    return (
      <div
        className={cn(
          // mobile: scroll horizontal con snap, sangrado al borde
          '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1',
          // desktop: grid normal de `cols` columnas
          'lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0',
          COLS_LG[cols]
        )}
      >
        {row.banners.map((b) => (
          <BannerTile
            key={b._id}
            banner={b}
            className={cn(
              'aspect-[5/3] w-[78%] shrink-0 snap-start lg:w-auto',
              aspectLg
            )}
          />
        ))}
      </div>
    );
  }

  // stack: 1 columna en mobile, grid de `cols` en desktop
  return (
    <div className={cn('grid grid-cols-1 gap-3 lg:gap-4', COLS_LG[cols])}>
      {row.banners.map((b) => (
        <BannerTile
          key={b._id}
          banner={b}
          className={cn('aspect-[5/3]', aspectLg)}
        />
      ))}
    </div>
  );
}
