'use client';

import { SectionHeader } from '@/components/m/home/SectionHeader';
import { ProductCarousel } from '@/components/m/home/ProductCarousel';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { useProducts } from '@/hooks/useProducts';
import type { HomeSectionConfig, HomeProductSource, Product } from '@/types';
import type { ProductQueryParams } from '@/services/products';

/**
 * Secciones de producto configurables de la home (Fase 2 del home layout).
 * Cada instancia es un componente con su propio fetch — así el admin puede
 * agregar N carruseles sin tocar código, y las secciones ocultas no gastan
 * requests (no se montan).
 */

/** Query + link "ver más" según la fuente configurada. */
function sourceToQuery(config: HomeSectionConfig): {
  params: ProductQueryParams;
  href: string;
} {
  const limit = config.limit ?? 8;
  switch (config.source as HomeProductSource) {
    case 'featured':
      return {
        params: { featured: true, limit },
        href: '/productos?featured=true',
      };
    case 'on_sale':
      return { params: { onSale: true, limit }, href: '/productos?onSale=true' };
    case 'popular':
      return { params: { sort: 'popular', limit }, href: '/productos?sort=popular' };
    case 'collection':
      return {
        params: { collection: config.collectionSlug, limit },
        href: `/productos?coleccion=${config.collectionSlug ?? ''}`,
      };
    case 'newest':
    default:
      return { params: { sort: 'newest', limit }, href: '/productos?sort=newest' };
  }
}

interface ProductSectionProps {
  config: HomeSectionConfig;
}

/** Carrusel horizontal de productos con encabezado configurable. */
export function ProductCarouselSection({ config }: ProductSectionProps) {
  const { params, href } = sourceToQuery(config);
  const { data, isLoading } = useProducts(params);
  const products: Product[] = data?.data || [];

  // Sin productos (ej. colección vacía) la sección desaparece sola.
  if (!isLoading && products.length === 0) return null;

  return (
    <>
      <SectionHeader
        title={config.title || 'Productos'}
        emoji={config.emoji}
        href={href}
      />
      <ProductCarousel products={products} isLoading={isLoading} />
    </>
  );
}

/** Grilla de productos (estilo "Más vendidos") con encabezado configurable. */
export function ProductGridSection({ config }: ProductSectionProps) {
  const { params, href } = sourceToQuery(config);
  const limit = config.limit ?? 5;
  const { data, isLoading } = useProducts({ ...params, limit: Math.max(limit, 5) });
  const products: Product[] = (data?.data || []).slice(0, limit);

  if (!isLoading && products.length === 0) return null;

  return (
    <>
      <SectionHeader
        title={config.title || 'Productos'}
        emoji={config.emoji}
        href={href}
      />
      <div className="grid grid-cols-2 gap-3 px-4 pb-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4 lg:px-8 lg:pb-12 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
              <div
                key={i}
                className="h-[240px] animate-pulse rounded-2xl bg-muted lg:h-auto lg:aspect-[3/4]"
              />
            ))
          : products.map((p) => <ProductCardM key={p._id} product={p} />)}
      </div>
    </>
  );
}
