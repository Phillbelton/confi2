'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/axios';
import { buildSrcSet } from '@/lib/imageSrcset';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { cn } from '@/lib/utils';
import type { ApiResponse, HomeSectionConfig } from '@/types';

/**
 * Grilla de categorías raíz — la puerta de entrada al catálogo desde la home.
 *
 * Usa el arte de categoría ya sembrado (bannerImage / bannerImageMobile) y,
 * si una categoría no tiene imagen, cae al gradiente + emoji de
 * categoryVisualConfig, igual que el hero del catálogo: nunca se ve vacío.
 *
 * Las dos primeras (las de mayor volumen) ocupan tile doble en desktop.
 */

interface CategoryCount {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  bannerImage?: string;
  bannerImageMobile?: string;
  count: number;
}

const BANNER_WIDTHS = [1280, 1600, 2000] as const;
const BANNER_MOBILE_WIDTHS = [640, 1000] as const;

function useCategoryCounts() {
  return useQuery({
    queryKey: ['categories', 'counts'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ categories: CategoryCount[] }>>(
        '/categories/counts'
      );
      return data.data?.categories ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function CategoryGrid({ config }: { config?: HomeSectionConfig }) {
  const { data: all = [], isLoading } = useCategoryCounts();

  const title = config?.title || 'Compra por categoría';
  const ctaText = config?.ctaText || 'Ver catálogo completo';

  // Orden: el que fije el admin (categorySlugs) o por volumen desc.
  // Se descartan las categorías sin productos (ej. "Otros" vacía).
  const picked = config?.categorySlugs?.length
    ? (config.categorySlugs
        .map((s) => all.find((c) => c.slug === s))
        .filter(Boolean) as CategoryCount[])
    : [...all].filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  const cats = picked.slice(0, config?.limit ?? 6);
  const total = all.reduce((n, c) => n + c.count, 0);

  if (isLoading) {
    return (
      <section className="px-4 pt-6 lg:px-8">
        <div className="mb-4 h-8 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'aspect-[5/2] animate-pulse rounded-2xl bg-muted lg:aspect-[20/7]',
                i < 2 && 'lg:col-span-2'
              )}
            />
          ))}
        </div>
      </section>
    );
  }

  if (cats.length === 0) return null;

  return (
    <section className="px-4 pt-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight lg:text-3xl">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
            {config?.subtitle ||
              `${total.toLocaleString('es-CL')} productos ordenados para encontrar rápido`}
          </p>
        </div>
        <Link
          href="/productos"
          className="shrink-0 whitespace-nowrap text-xs font-bold text-primary hover:underline lg:text-sm"
        >
          {ctaText} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cats.map((cat, i) => (
          <CategoryTile key={cat._id} cat={cat} wide={i < 2} priority={i < 2} />
        ))}
      </div>
    </section>
  );
}

function CategoryTile({
  cat,
  wide,
  priority,
}: {
  cat: CategoryCount;
  wide: boolean;
  priority: boolean;
}) {
  const cfg = getCategoryVisualConfig(cat.name);
  const desktop = cat.bannerImage ? buildSrcSet(cat.bannerImage, BANNER_WIDTHS) : null;
  const mobile = cat.bannerImageMobile
    ? buildSrcSet(cat.bannerImageMobile, BANNER_MOBILE_WIDTHS)
    : desktop;

  return (
    <Link
      href={`/productos?categoria=${cat.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5',
        // Alturas reservadas → sin CLS mientras carga la imagen.
        'aspect-[5/2] lg:aspect-[20/7]',
        'bg-gradient-to-br',
        cfg.gradient,
        wide && 'lg:col-span-2 lg:aspect-[40/7]'
      )}
    >
      {mobile && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={mobile.src}
          srcSet={mobile.srcSet}
          sizes="(max-width: 1024px) 50vw, 100vw"
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:hidden"
        />
      )}
      {desktop && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={desktop.src}
          srcSet={desktop.srcSet}
          sizes="(max-width: 1024px) 50vw, 33vw"
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 hidden h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:block"
        />
      )}

      {!desktop && (
        <span
          className="pointer-events-none absolute -right-1 bottom-0 select-none text-6xl leading-none opacity-30 lg:text-7xl"
          aria-hidden
        >
          {cfg.emoji}
        </span>
      )}

      <span
        className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent"
        aria-hidden
      />

      <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-foreground lg:text-[11px]">
        {cat.count}
      </span>

      <span className="absolute inset-x-3 bottom-3 text-white lg:inset-x-4 lg:bottom-4">
        <span className="block font-display text-base font-bold leading-tight drop-shadow-sm lg:text-xl">
          {cat.name}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold opacity-90">
          <span className="line-clamp-1">{cfg.description}</span>
          <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
