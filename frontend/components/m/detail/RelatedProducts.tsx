'use client';

import { SectionHeader } from '@/components/m/home/SectionHeader';
import { ProductCarousel } from '@/components/m/home/ProductCarousel';
import { useRelatedProducts } from '@/hooks/useProducts';
import type { ProductQueryParams } from '@/services/products';
import type { Brand, Category, Product } from '@/types';

/** Cuántos productos se muestran por carrusel. */
const SHOWN = 12;
/**
 * Se pide de más porque hay dos descartes posibles sobre la respuesta: el
 * propio producto (el endpoint no tiene "excluir id") y, en el carrusel de
 * marca, los que ya aparecieron en el de categoría.
 */
const FETCH = SHOWN + 8;

interface RelatedProductsProps {
  product: Product;
}

/**
 * Carruseles de productos relacionados al pie de la ficha.
 *
 * Se arma con el endpoint público que ya existe (`/products` filtra por
 * `categories` y `brands` aceptando slugs, y expande la categoría a sus
 * descendientes), así que no hay backend nuevo. La relevancia sale de
 * `sort=popular`, que ordena por `views` — el contador que la propia ficha
 * incrementa en cada visita.
 *
 * Cascada: categoría → marca, con "lo más visto" del catálogo como respaldo
 * cuando el producto no tiene categoría o su categoría no da para llenar nada.
 */
export function RelatedProducts({ product }: RelatedProductsProps) {
  const primaryCat = (product.categories as Category[] | undefined)?.find(
    (c): c is Category => typeof c === 'object' && !!c?.slug
  );
  const brand = typeof product.brand === 'object' ? (product.brand as Brand) : undefined;

  const base: ProductQueryParams = { limit: FETCH, sort: 'popular' };
  const catRes = useRelatedProducts(
    primaryCat?.slug ? { ...base, categories: primaryCat.slug } : undefined
  );
  const brandRes = useRelatedProducts(brand?.slug ? { ...base, brands: brand.slug } : undefined);

  const exclude = (list: Product[] | undefined, alreadyShown: Set<string> = new Set()) =>
    (list ?? [])
      .filter((p) => p._id !== product._id && !alreadyShown.has(p._id))
      .slice(0, SHOWN);

  const catList = exclude(catRes.data?.data);
  const shownIds = new Set(catList.map((p) => p._id));
  const brandList = exclude(brandRes.data?.data, shownIds);

  // Respaldo: solo se pide si la categoría ya resolvió y no alcanzó. Evita una
  // tercera request en el caso normal (producto con categoría poblada).
  const catSettled = !primaryCat?.slug || catRes.isFetched;
  const needsFallback = catSettled && catList.length === 0;
  const fallbackRes = useRelatedProducts(needsFallback ? base : undefined);
  const fallbackList = exclude(fallbackRes.data?.data);

  const catLoading = !!primaryCat?.slug && catRes.isLoading;
  const brandLoading = !!brand?.slug && brandRes.isLoading;

  const sections: Array<{
    key: string;
    title: string;
    emoji?: string;
    href: string;
    products: Product[];
    isLoading: boolean;
  }> = [];

  if (catLoading || catList.length > 0) {
    sections.push({
      key: 'categoria',
      title: `Más de ${primaryCat?.name ?? 'esta categoría'}`,
      emoji: '🍬',
      href: `/productos?categoria=${primaryCat?.slug ?? ''}`,
      products: catList,
      isLoading: catLoading,
    });
  } else if (needsFallback && (fallbackRes.isLoading || fallbackList.length > 0)) {
    sections.push({
      key: 'fallback',
      title: 'Lo más visto',
      emoji: '👀',
      href: '/productos?sort=popular',
      products: fallbackList,
      isLoading: fallbackRes.isLoading,
    });
  }

  if (brand?.slug && (brandLoading || brandList.length > 0)) {
    sections.push({
      key: 'marca',
      title: `Más de ${brand.name}`,
      emoji: '🏷️',
      href: `/productos?brands=${brand.slug}`,
      products: brandList,
      isLoading: brandLoading,
    });
  }

  if (sections.length === 0) return null;

  return (
    <section className="border-t border-border/60 pt-2">
      {sections.map((s) => (
        <div key={s.key}>
          <SectionHeader title={s.title} emoji={s.emoji} href={s.href} />
          <ProductCarousel products={s.products} isLoading={s.isLoading} />
        </div>
      ))}
    </section>
  );
}
