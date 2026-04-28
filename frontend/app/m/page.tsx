'use client';

import { CategoryChips } from '@/components/m/shell/CategoryChips';
import { HeroCompact } from '@/components/m/home/HeroCompact';
import { SectionHeader } from '@/components/m/home/SectionHeader';
import { ProductCarousel } from '@/components/m/home/ProductCarousel';
import { CollectionsGrid } from '@/components/m/home/CollectionsGrid';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import type { ProductParent } from '@/types';

export default function MHomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedProducts();
  const featured: ProductParent[] = (featuredData?.data as ProductParent[] | undefined) || [];

  const { data: onSaleData, isLoading: onSaleLoading } = useProducts({
    onSale: true,
    limit: 8,
  });
  const onSale: ProductParent[] = onSaleData?.data || [];

  const { data: newestData, isLoading: newestLoading } = useProducts({
    sort: 'newest',
    limit: 8,
  });
  const newest: ProductParent[] = newestData?.data || [];

  const { data: bestSellersData, isLoading: bestLoading } = useProducts({
    sort: 'popular',
    limit: 6,
  });
  const bestSellers: ProductParent[] = bestSellersData?.data || [];

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

      <section className="px-4 py-3">
        <div className="rounded-3xl bg-gradient-to-r from-accent/15 via-accent/10 to-primary/10 p-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
            Comprá por mayor
          </p>
          <p className="mt-1 font-display text-base font-bold leading-snug">
            Más cantidad, mejor precio 🎉
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {bestLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[260px] animate-pulse rounded-2xl bg-muted" />
            ))
          : bestSellers
              .slice(0, 4)
              .map((p) => (
                <ProductCardM key={p._id} product={p} autoFetchVariants />
              ))}
      </div>
    </>
  );
}
