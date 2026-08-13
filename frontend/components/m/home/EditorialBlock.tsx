'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/axios';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { buildSrcSet } from '@/lib/imageSrcset';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { useAllCategories } from '@/hooks/useCatalogBreadcrumbs';
import { cn } from '@/lib/utils';
import type { ApiResponse, HomeSectionConfig, Product } from '@/types';

/**
 * Bloque editorial: el banner de una categoría y SUS productos dentro de una
 * misma unidad visual, en vez de una franja de banner y otra de productos sin
 * relación. Da contexto ("arma la piñata por menos") y al lado, con qué hacerlo.
 *
 * El arte sale de la categoría configurada (bannerImage / bannerImageMobile);
 * si no tiene, cae al gradiente + emoji de categoryVisualConfig.
 */

const BANNER_WIDTHS = [1280, 1600, 2000] as const;
const BANNER_MOBILE_WIDTHS = [640, 1000] as const;
/** Miniatura 1:1 de categoría (variant=thumb del backend). */
const THUMB_WIDTHS = [200, 400, 800] as const;

export function EditorialBlock({ config }: { config?: HomeSectionConfig }) {
  const slug = config?.categorySlug;
  const limit = config?.limit ?? 4;

  const { data: cats = [] } = useAllCategories();
  const category = slug ? cats.find((c) => c.slug === slug) : undefined;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['home', 'editorial', slug, limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ data: Product[] }>>('/products', {
        params: { category: slug, limit, sort: 'popular' },
      });
      return data.data?.data ?? [];
    },
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });

  if (!slug) return null;
  // Sin productos no hay bloque editorial que mostrar (evita un banner huérfano).
  if (!isLoading && products.length === 0) return null;

  const cfg = getCategoryVisualConfig(category?.name);
  // El panel de escritorio es ALTO: el banner 20:3 dejaría el motivo fuera de
  // cuadro, así que se usa la miniatura 1:1 (y el banner solo como respaldo).
  // En mobile el panel es apaisado, ahí sí calza el banner 5:2.
  const desktop = category?.image
    ? buildSrcSet(category.image, THUMB_WIDTHS)
    : category?.bannerImage
      ? buildSrcSet(category.bannerImage, BANNER_WIDTHS)
      : null;
  const mobile = category?.bannerImageMobile
    ? buildSrcSet(category.bannerImageMobile, BANNER_MOBILE_WIDTHS)
    : desktop;

  const href = `/productos?categoria=${slug}`;
  const title = config?.title || category?.name || 'Destacado';
  const ctaText = config?.ctaText || `Ver todo ${category?.name ?? ''}`.trim();

  return (
    <section className="px-4 pt-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-3 shadow-sm lg:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-4">
          {/* Panel de contexto */}
          <Link
            href={href}
            className={cn(
              'group relative flex min-h-[160px] flex-col justify-end overflow-hidden rounded-2xl p-4 lg:min-h-full lg:p-5',
              'bg-gradient-to-br',
              cfg.gradient
            )}
          >
            {mobile && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mobile.src}
                srcSet={mobile.srcSet}
                sizes="100vw"
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:hidden"
              />
            )}
            {desktop && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={desktop.src}
                srcSet={desktop.srcSet}
                sizes="340px"
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 hidden h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:block"
              />
            )}
            {!desktop && (
              <span
                className="pointer-events-none absolute right-2 top-3 select-none text-6xl opacity-35"
                aria-hidden
              >
                {cfg.emoji}
              </span>
            )}
            <span
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
              aria-hidden
            />
            <span className="relative z-10 text-white">
              {config?.kicker && (
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-85">
                  {config.kicker}
                </span>
              )}
              <span className="mt-1 block font-display text-xl font-bold leading-tight drop-shadow-sm lg:text-2xl">
                {title}
              </span>
              {config?.subtitle && (
                <span className="mt-1 block text-xs opacity-90">{config.subtitle}</span>
              )}
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-foreground shadow-md">
                {ctaText}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>

          {/* Productos de esa categoría */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: limit }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
                ))
              : products.map((p) => <ProductCardM key={p._id} product={p} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
