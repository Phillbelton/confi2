'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { buildSrcSet } from '@/lib/imageSrcset';
import { useBanners } from '@/hooks/useBanners';
import { useAllCategories, useCollectionBySlug } from '@/hooks/useCatalogBreadcrumbs';
import {
  getCategoryVisualConfig,
  hasCategoryVisualConfig,
} from '@/lib/categoryVisualConfig';
import type { Banner, Category } from '@/types';

interface CategoryHeroProps {
  categorySlug?: string;
  subcategorySlug?: string;
  collectionSlug?: string;
  /** Total de productos del resultado actual (para el pill del hero). */
  total?: number;
  isLoadingTotal?: boolean;
}

/** Anchos emitidos por el backend para cada encuadre de categoría. */
const BANNER_WIDTHS = [1280, 1600, 2000] as const;
const BANNER_MOBILE_WIDTHS = [640, 1000] as const;

/**
 * Hero del catálogo. Cabecera visual sobre la grilla con tres niveles de
 * fallback, para que SIEMPRE se vea intencional:
 *
 *  1. Banner de campaña (placement category_top / collection_top en /admin/banners
 *     cuyo link apunte a la categoría/colección activa) — permite vestir una
 *     categoría por temporada (Halloween, Navidad) con schedule.
 *  2. Imagen propia de la entidad (category.bannerImage / collection.image,
 *     subida en /admin/categorias).
 *  3. Gradiente + emoji de categoryVisualConfig (sin imagen no se ve vacío).
 *
 * Alturas FIJAS por breakpoint (aspect en mobile, alto fijo en desktop) para
 * no introducir CLS: la caja se reserva aunque la imagen aún esté cargando.
 */
export function CategoryHero({
  categorySlug,
  subcategorySlug,
  collectionSlug,
  total,
  isLoadingTotal,
}: CategoryHeroProps) {
  const { data: cats = [], isLoading: catsLoading } = useAllCategories();
  const { data: collection, isLoading: collLoading } = useCollectionBySlug(collectionSlug);

  // Banners de campaña — solo se consultan cuando aplica el placement.
  const { data: catBanners = [] } = useBanners('category_top', {
    enabled: !!(categorySlug || subcategorySlug) && !collectionSlug,
  });
  const { data: collBanners = [] } = useBanners('collection_top', {
    enabled: !!collectionSlug,
  });

  // Resolver la categoría activa (la más profunda) y su raíz para el fallback visual.
  const { category, rootCategory } = useMemo(() => {
    const bySlug = (slug?: string) => (slug ? cats.find((c) => c.slug === slug) : undefined);
    const deepest = bySlug(subcategorySlug) || bySlug(categorySlug);
    let root: Category | undefined = deepest;
    const seen = new Set<string>();
    while (root?.parent && !seen.has(root._id)) {
      seen.add(root._id);
      const parentId = typeof root.parent === 'string' ? root.parent : root.parent._id;
      const parent = cats.find((c) => c._id === parentId);
      if (!parent) break;
      root = parent;
    }
    return { category: deepest, rootCategory: root };
  }, [cats, categorySlug, subcategorySlug]);

  // Banner de campaña que apunte a la entidad activa (subcategoría > categoría).
  const campaignBanner: Banner | undefined = useMemo(() => {
    if (collectionSlug) {
      return collBanners.find(
        (b) => b.link?.type === 'collection' && b.link.target === collectionSlug
      );
    }
    const bySlug = (slug?: string) =>
      slug
        ? catBanners.find((b) => b.link?.type === 'category' && b.link.target === slug)
        : undefined;
    return bySlug(subcategorySlug) || bySlug(categorySlug);
  }, [catBanners, collBanners, categorySlug, subcategorySlug, collectionSlug]);

  // Config visual: la categoría activa si está curada; si no, su raíz.
  const config = getCategoryVisualConfig(
    category && hasCategoryVisualConfig(category.name) ? category.name : rootCategory?.name
  );

  const isGeneric = !categorySlug && !subcategorySlug && !collectionSlug;
  const resolving =
    (!isGeneric && !collection && !category && (catsLoading || collLoading)) || false;

  const title = collection?.name ?? category?.name ?? 'Catálogo';
  const description = isGeneric
    ? 'Dulces, chocolates, bebidas y snacks — todo el surtido de la confitería.'
    : campaignBanner?.subtitle ||
      collection?.description ||
      category?.description ||
      config.description;

  // Imagen efectiva por breakpoint (campaña > entidad > nada).
  const desktopUrl =
    campaignBanner?.image || category?.bannerImage || collection?.image || undefined;
  const mobileUrl =
    campaignBanner?.imageMobile ||
    category?.bannerImageMobile ||
    campaignBanner?.image ||
    category?.bannerImage ||
    collection?.image ||
    undefined;

  const desktopAttrs = desktopUrl ? buildSrcSet(desktopUrl, BANNER_WIDTHS) : null;
  const mobileAttrs = mobileUrl ? buildSrcSet(mobileUrl, BANNER_MOBILE_WIDTHS) : null;

  const emoji = collection?.emoji || config.emoji;
  const gradient = collection?.gradient || (isGeneric ? 'from-primary to-secondary' : config.gradient);

  return (
    <section className="px-4 pt-3 lg:px-8 lg:pt-4">
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5',
          // Altura reservada: 5:2 en mobile, huincha 20:3 en desktop.
          'aspect-[5/2] lg:aspect-[20/3]',
          // Fallback de gradiente SIEMPRE presente debajo de la imagen.
          'bg-gradient-to-br',
          gradient
        )}
      >
        {/* Capa imagen — mobile y desktop con encuadres propios */}
        {mobileAttrs && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mobileAttrs.src}
            srcSet={mobileAttrs.srcSet}
            sizes="100vw"
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover lg:hidden"
          />
        )}
        {desktopAttrs && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={desktopAttrs.src}
            srcSet={desktopAttrs.srcSet}
            sizes="(max-width: 1024px) 100vw, 1376px"
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 hidden h-full w-full object-cover lg:block"
          />
        )}

        {/* Decoración cuando NO hay imagen: emoji watermark + blobs */}
        {!desktopAttrs && (
          <>
            <span
              className="pointer-events-none absolute -right-2 bottom-0 select-none text-[110px] leading-none opacity-25 lg:right-24 lg:text-[150px] lg:opacity-30"
              aria-hidden
            >
              {emoji}
            </span>
            <div
              className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-1/4 -bottom-14 h-36 w-36 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />
          </>
        )}

        {/* Velo de legibilidad para el texto (izquierda → transparente) */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent"
          aria-hidden
        />

        {/* Contenido */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 text-white lg:justify-center lg:px-8 lg:py-5">
          {resolving ? (
            <div className="space-y-2" aria-hidden>
              <div className="h-7 w-44 animate-pulse rounded-lg bg-white/30 lg:h-9 lg:w-64" />
              <div className="h-3.5 w-64 animate-pulse rounded bg-white/20 lg:w-96" />
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold leading-tight drop-shadow-sm lg:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-0.5 line-clamp-1 max-w-xl text-xs opacity-90 lg:mt-1 lg:text-sm">
                  {description}
                </p>
              )}
              {typeof total === 'number' && !isLoadingTotal && (
                <span className="mt-2 inline-flex w-fit items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm lg:mt-2.5">
                  {total} producto{total === 1 ? '' : 's'}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
