'use client';

import { Fragment } from 'react';
import { SectionHeader } from '@/components/m/home/SectionHeader';
import { ProductCarousel } from '@/components/m/home/ProductCarousel';
import { CollectionsGrid } from '@/components/m/home/CollectionsGrid';
import { PromoGrid } from '@/components/m/home/PromoGrid';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import { useHomeLayout } from '@/hooks/useHomeLayout';
import type { HomeSectionKey, Product } from '@/types';

/**
 * La home se arma desde el layout gestionable en /admin/banners (orden y
 * visibilidad de secciones viven en Mongo — cero deploys para cambiarlos).
 * Acá solo viven los renderers de cada tipo de sección.
 */
export default function HomePage() {
  const { sections } = useHomeLayout();

  const { data: featuredData, isLoading: featuredLoading } = useFeaturedProducts();
  const featured: Product[] = (featuredData?.data as Product[] | undefined) || [];

  const { data: onSaleData, isLoading: onSaleLoading } = useProducts({
    onSale: true,
    limit: 8,
  });
  const onSale: Product[] = onSaleData?.data || [];

  const { data: newestData, isLoading: newestLoading } = useProducts({
    sort: 'newest',
    limit: 8,
  });
  const newest: Product[] = newestData?.data || [];

  const { data: bestSellersData, isLoading: bestLoading } = useProducts({
    sort: 'popular',
    limit: 10,
  });
  const bestSellers: Product[] = bestSellersData?.data || [];

  // Mientras llega el layout (una sola vez por sesión, después queda cacheado)
  // se reserva el alto del hero para no saltar el contenido.
  if (!sections) {
    return (
      <div className="px-4 pt-3 lg:px-0 lg:pt-4">
        <div className="aspect-[700/330] animate-pulse rounded-2xl bg-muted lg:aspect-[1920/364] lg:rounded-none" />
      </div>
    );
  }

  const RENDERERS: Record<HomeSectionKey, () => React.ReactNode> = {
    hero: () => (
      <PromoGrid placement="home_hero" className="px-4 pt-3 lg:px-0 lg:pt-4" />
    ),
    offers: () => (
      <>
        <SectionHeader title="Ofertas" emoji="🔥" href="/productos?onSale=true" />
        <ProductCarousel products={onSale} isLoading={onSaleLoading} />
      </>
    ),
    secondary_banners: () => <PromoGrid placement="home_secondary" />,
    featured: () => (
      <>
        <SectionHeader
          title="Destacados"
          emoji="⭐"
          href="/productos?featured=true"
        />
        <ProductCarousel products={featured} isLoading={featuredLoading} />
      </>
    ),
    collections: () => <CollectionsGrid variant="carousel" />,
    wholesale_cta: () => (
      <section className="px-4 py-3 lg:px-8 lg:py-6">
        <div className="rounded-3xl bg-gradient-to-r from-accent/15 via-accent/10 to-primary/10 p-4 text-center lg:p-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent lg:text-sm">
            Comprá por mayor
          </p>
          <p className="mt-1 font-display text-base font-bold leading-snug lg:text-2xl">
            Más cantidad, mejor precio 🎉
          </p>
          <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
            Descuentos automáticos según el volumen.
          </p>
        </div>
      </section>
    ),
    newest: () => (
      <>
        <SectionHeader
          title="Novedades"
          subtitle="Recién llegados al catálogo"
          emoji="✨"
          href="/productos?sort=newest"
        />
        <ProductCarousel products={newest} isLoading={newestLoading} />
      </>
    ),
    promo_banners: () => <PromoGrid placement="home_promo" />,
    best_sellers: () => (
      <>
        <SectionHeader title="Más vendidos" emoji="🏆" href="/productos?sort=popular" />
        <div className="grid grid-cols-2 gap-3 px-4 pb-6 lg:grid-cols-4 lg:gap-4 lg:px-8 lg:pb-12 xl:grid-cols-5">
          {bestLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[260px] animate-pulse rounded-2xl bg-muted lg:h-auto lg:aspect-[3/4]"
                />
              ))
            : bestSellers.slice(0, 5).map((p) => <ProductCardM key={p._id} product={p} />)}
        </div>
      </>
    ),
  };

  return (
    <>
      {sections
        .filter((s) => s.active)
        .map((s) => (
          <Fragment key={s.key}>{RENDERERS[s.key]?.()}</Fragment>
        ))}
    </>
  );
}
