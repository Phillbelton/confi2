'use client';

import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronLeft } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useProductBySlug, useProductVariants, useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCollection } from '@/hooks/useCollections';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { ProductGalleryM } from '@/components/m/detail/ProductGalleryM';
import { StickyAddToCart } from '@/components/m/detail/StickyAddToCart';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/m/detail/Breadcrumbs';
import { ProductCarousel } from '@/components/m/home/ProductCarousel';
import { SectionHeader } from '@/components/m/home/SectionHeader';
import { showCartToast } from '@/components/m/shell/cart-toast-m';
import { getSafeImageUrl } from '@/lib/image-utils';
import { categoryVisualMap } from '@/lib/categoryVisualConfig';
import {
  calculateItemDiscount,
  getDiscountTiers,
  hasActiveDiscount,
} from '@/lib/discountCalculator';
import { cn } from '@/lib/utils';
import type { Brand, Category, ProductParent, ProductVariant } from '@/types';

export default function MProductDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const { data: productData, isLoading, error } = useProductBySlug(slug);
  const product = productData?.data;

  const { data: variantsData } = useProductVariants(product?._id || '');
  const variants: ProductVariant[] = variantsData?.data || [];

  const [selectedVariantIdState, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const addItem = useCartStoreM((s) => s.addItem);

  const selectedVariantId = selectedVariantIdState || variants[0]?._id || '';
  const variant = variants.find((v) => v._id === selectedVariantId) || variants[0];

  const categoryIds = product?.categories
    ? typeof product.categories[0] === 'string'
      ? (product.categories as string[])
      : (product.categories as { _id: string }[]).map((c) => c._id)
    : [];

  const { data: relatedData } = useProducts({
    categories: categoryIds,
    limit: 6,
  });
  const related: ProductParent[] = (relatedData?.data || []).filter(
    (p: ProductParent) => p._id !== product?._id
  );

  // ========================================================================
  // BREADCRUMBS — estrategia híbrida (referrer + taxonomía)
  // ========================================================================
  // El "from" trae el querystring serializado del catálogo origen.
  // Si existe → mostrar el camino real (categoría/colección + subcategoría).
  // Si no → cae a taxonomía: categoría primaria del producto.
  const fromParams = useMemo(() => {
    const raw = searchParams.get('from');
    if (!raw) return null;
    try {
      return new URLSearchParams(raw);
    } catch {
      return null;
    }
  }, [searchParams]);

  const fromCategorySlug = fromParams?.get('categoria') || undefined;
  const fromSubcategorySlug = fromParams?.get('subcategoria') || undefined;
  const fromCollectionSlug = fromParams?.get('coleccion') || undefined;

  const { data: allCategoriesData } = useCategories();
  const allCategories: Category[] = (allCategoriesData as Category[]) || [];

  // Resolver datos de la colección si vino desde una
  const { data: fromCollection } = useCollection(fromCollectionSlug || '', 'slug');

  // Categoría primaria del producto (fallback de taxonomía)
  const primaryCategory: Category | undefined = useMemo(() => {
    if (!product?.categories || product.categories.length === 0) return undefined;
    const first = product.categories[0];
    if (typeof first === 'string') {
      return allCategories.find((c) => c._id === first);
    }
    return first as Category;
  }, [product, allCategories]);

  // Si la categoría primaria es subcategoría, encontrar también su padre
  const primaryParentCategory: Category | undefined = useMemo(() => {
    if (!primaryCategory?.parent) return undefined;
    const parentId =
      typeof primaryCategory.parent === 'string'
        ? primaryCategory.parent
        : (primaryCategory.parent as Category)._id;
    return allCategories.find((c) => c._id === parentId);
  }, [primaryCategory, allCategories]);

  // Helper: armar querystring del eslabón de vuelta preservando filtros
  const buildHref = (overrides: Record<string, string | undefined>): string => {
    const params = new URLSearchParams(fromParams?.toString() || '');
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/m/productos?${qs}` : '/m/productos';
  };

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (!product) return [];
    const items: BreadcrumbItem[] = [];

    // RAMA REFERRER: viene de una colección
    if (fromCollectionSlug && fromCollection) {
      items.push({
        label: fromCollection.name,
        emoji: fromCollection.emoji,
        href: buildHref({ subcategoria: undefined }),
      });
      // Si además filtró por subcategoría dentro de la colección
      if (fromSubcategorySlug) {
        const sub = allCategories.find((c) => c.slug === fromSubcategorySlug);
        if (sub) {
          items.push({
            label: sub.name.replace(/^Subcat-\w+-/, ''),
            href: buildHref({}),
          });
        }
      }
    }
    // RAMA REFERRER: viene de una categoría
    else if (fromCategorySlug) {
      const cat = allCategories.find((c) => c.slug === fromCategorySlug);
      if (cat) {
        const visual = categoryVisualMap[cat.name];
        items.push({
          label: cat.name.replace(/^Categoria-\d+-/, ''),
          emoji: visual?.emoji,
          href: buildHref({ subcategoria: undefined }),
        });
      }
      if (fromSubcategorySlug) {
        const sub = allCategories.find((c) => c.slug === fromSubcategorySlug);
        if (sub) {
          items.push({
            label: sub.name.replace(/^Subcat-\w+-/, ''),
            href: buildHref({}),
          });
        }
      }
    }
    // RAMA TAXONOMÍA: link directo, derivar de categorías del producto
    else if (primaryCategory) {
      if (primaryParentCategory) {
        const visual = categoryVisualMap[primaryParentCategory.name];
        items.push({
          label: primaryParentCategory.name.replace(/^Categoria-\d+-/, ''),
          emoji: visual?.emoji,
          href: `/m/productos?categoria=${primaryParentCategory.slug}`,
        });
        items.push({
          label: primaryCategory.name.replace(/^Subcat-\w+-/, ''),
          href: `/m/productos?categoria=${primaryParentCategory.slug}&subcategoria=${primaryCategory.slug}`,
        });
      } else {
        const visual = categoryVisualMap[primaryCategory.name];
        items.push({
          label: primaryCategory.name.replace(/^Categoria-\d+-/, ''),
          emoji: visual?.emoji,
          href: `/m/productos?categoria=${primaryCategory.slug}`,
        });
      }
    }

    // Último eslabón: producto (no clickeable)
    items.push({
      label: product.name,
      current: true,
    });

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    product,
    fromCollectionSlug,
    fromCollection,
    fromCategorySlug,
    fromSubcategorySlug,
    primaryCategory,
    primaryParentCategory,
    allCategories,
  ]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-xl font-bold">Producto no encontrado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El producto que buscás no existe o fue eliminado.
        </p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/m/productos">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !product || !variant) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const allImages = (
    variant.images && variant.images.length > 0
      ? variant.images
      : product.images || []
  ).filter(Boolean);

  const hasDisc = hasActiveDiscount(variant, product);
  const priceInfo = calculateItemDiscount(variant, quantity, product);
  const tiers = getDiscountTiers(variant, product);

  const finalUnitPrice = priceInfo?.finalPrice ?? variant.price;
  const originalUnitPrice = priceInfo?.originalPrice ?? variant.price;

  const brandName =
    product.brand && typeof product.brand === 'object'
      ? (product.brand as Brand).name
      : null;

  const handleAdd = () => {
    setIsAdding(true);
    addItem(product, variant, quantity);
    showCartToast({
      productName: product.name,
      variantName: variant.displayName,
      image: getSafeImageUrl(allImages[0], { width: 128, height: 128 }),
      quantity,
    });
    setTimeout(() => setIsAdding(false), 400);
  };

  return (
    <>
      <Breadcrumbs
        items={breadcrumbItems}
        className="border-b border-border/40 bg-muted/40"
      />

      <ProductGalleryM images={allImages} alt={product.name} />

      <div className="px-4 pb-32 pt-4">
        {brandName && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            {brandName}
          </p>
        )}
        <h1 className="mt-1 font-display text-xl font-bold leading-tight">
          {product.name}
        </h1>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">
            ${Math.round(finalUnitPrice).toLocaleString('es-CL')}
          </span>
          {hasDisc && originalUnitPrice > finalUnitPrice && (
            <span className="text-sm text-muted-foreground line-through tabular-nums">
              ${Math.round(originalUnitPrice).toLocaleString('es-CL')}
            </span>
          )}
        </div>

        {variants.length > 1 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold">Presentación</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const isActive = v._id === selectedVariantId;
                return (
                  <button
                    key={v._id}
                    type="button"
                    onClick={() => {
                      setSelectedVariantId(v._id);
                      setQuantity(1);
                    }}
                    className={cn(
                      'tappable inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    {isActive && <Check className="h-3.5 w-3.5" />}
                    {v.displayName ||
                      Object.values(v.attributes || {}).join(' · ') ||
                      v.sku}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tiers && tiers.length > 0 && (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Descuento por mayor 🎉
            </p>
            <ul className="mt-2 space-y-1 text-xs text-foreground">
              {tiers.map((t, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{t.range}</span>
                  <span className="font-bold text-primary">
                    −{t.discount} <span className="opacity-60">· {t.price}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Accordion type="single" collapsible className="mt-5">
          <AccordionItem value="desc" className="border-b">
            <AccordionTrigger className="text-sm font-semibold">
              Descripción
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {product.description || 'Sin descripción disponible.'}
            </AccordionContent>
          </AccordionItem>
          {product.tags && product.tags.length > 0 && (
            <AccordionItem value="tags" className="border-b">
              <AccordionTrigger className="text-sm font-semibold">
                Etiquetas
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {related.length > 0 && (
          <>
            <SectionHeader title="Te puede gustar" emoji="💡" />
            <ProductCarousel products={related.slice(0, 6)} />
          </>
        )}
      </div>

      <StickyAddToCart
        quantity={quantity}
        unitPrice={finalUnitPrice}
        onIncrement={() => setQuantity((q) => q + 1)}
        onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
        onAdd={handleAdd}
        isAdding={isAdding}
      />
    </>
  );
}
