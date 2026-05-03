'use client';

import { CategoryChips } from '@/components/m/shell/CategoryChips';
import { HeroCompact } from '@/components/m/home/HeroCompact';
import { SectionHeader } from '@/components/m/home/SectionHeader';
import { ProductCarousel } from '@/components/m/home/ProductCarousel';
import { CollectionsGrid } from '@/components/m/home/CollectionsGrid';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

export default function MHomePage() {
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

  return (
    <>
      <HeroCompact />
      <CategoryChips />

      <SectionHeader
        title="Destacados"
        subtitle="Lo más recomendado por Quelita"
        emoji="⭐"
        href="/m/productos?featured=true"
      />
      <ProductCarousel products={featured} isLoading={featuredLoading} />

      <CollectionsGrid variant="double" />

      <SectionHeader
        title="Ofertas"
        subtitle="Descuentos especiales por tiempo limitado"
        emoji="🔥"
        href="/m/productos?onSale=true"
      />
      <ProductCarousel products={onSale} isLoading={onSaleLoading} />

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

      <SectionHeader
        title="Novedades"
        subtitle="Recién llegados al catálogo"
        emoji="✨"
        href="/m/productos?sort=newest"
      />
      <ProductCarousel products={newest} isLoading={newestLoading} />

      <SectionHeader
        title="Más vendidos"
        emoji="🏆"
        href="/m/productos?sort=popular"
      />
      <div className="grid grid-cols-2 gap-3 px-4 pb-6 lg:grid-cols-4 lg:gap-4 lg:px-8 lg:pb-12 xl:grid-cols-5">
        {bestLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[260px] animate-pulse rounded-2xl bg-muted lg:h-auto lg:aspect-[3/4]" />
            ))
          : bestSellers
              .slice(0, 5)
              .map((p) => (
                <ProductCardM key={p._id} product={p} />
              ))}
      </div>
    </>
  );
}
