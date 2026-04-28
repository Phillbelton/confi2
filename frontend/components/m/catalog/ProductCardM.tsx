'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { useProductVariants } from '@/hooks/useProducts';
import { getSafeImageUrl } from '@/lib/image-utils';
import {
  calculateItemDiscount,
  getDiscountBadge,
  getDiscountTiers,
  hasActiveDiscount,
} from '@/lib/discountCalculator';
import { DiscountSticker } from '@/components/products/DiscountSticker';
import { showCartToast } from '@/components/m/shell/cart-toast-m';
import { cn } from '@/lib/utils';
import type { ProductParent, ProductVariant } from '@/types';

/** Color progression for tiered discount tags: cool → hot */
const TIER_TAG_COLORS = [
  '#0ABDC6', // primary teal
  '#3B82F6', // blue
  '#7C3AED', // purple
  '#E63946', // accent red
];

interface ProductCardMProps {
  product: ProductParent;
  variants?: ProductVariant[];
  autoFetchVariants?: boolean;
  className?: string;
  /** Cuando es true se renderiza más compacto para carruseles horizontales */
  horizontal?: boolean;
}

export function ProductCardM({
  product,
  variants: externalVariants = [],
  autoFetchVariants = false,
  className,
  horizontal = false,
}: ProductCardMProps) {
  const searchParams = useSearchParams();
  const { data: fetchedData } = useProductVariants(autoFetchVariants ? product._id : '');
  const variants = autoFetchVariants ? fetchedData?.data || [] : externalVariants;

  // Propagar contexto del catálogo al detalle vía ?from=<querystring>
  // Permite al detalle reconstruir breadcrumbs con la ruta real del usuario.
  const fromQs = searchParams?.toString();
  const productHref = fromQs
    ? `/m/productos/${product.slug}?from=${encodeURIComponent(fromQs)}`
    : `/m/productos/${product.slug}`;

  const [isAdding, setIsAdding] = useState(false);

  const addItem = useCartStoreM((s) => s.addItem);
  const updateQuantity = useCartStoreM((s) => s.updateQuantity);
  const items = useCartStoreM((s) => s.items);

  const variant = variants[0];
  const inCart = variant ? items.find((i) => i.variantId === variant._id)?.quantity || 0 : 0;

  const image = getSafeImageUrl(variant?.images?.[0] || product.images?.[0], {
    width: 320,
    height: 320,
    quality: 'auto',
  });

  const hasDiscount = variant ? hasActiveDiscount(variant, product) : false;
  const badge = variant ? getDiscountBadge(variant, product) : null;
  const tiers = variant ? getDiscountTiers(variant, product) : null;
  const priceInfo = variant ? calculateItemDiscount(variant, 1, product) : null;
  const finalPrice = priceInfo?.finalPrice ?? variant?.price ?? 0;
  const originalPrice = priceInfo?.originalPrice ?? variant?.price ?? 0;

  if (!variant) return null;

  // En carruseles horizontales (cards más angostas) limitamos a 2 tiers
  const visibleTiers = tiers ? (horizontal ? tiers.slice(0, 2) : tiers.slice(0, 3)) : null;

  const handleAdd = () => {
    setIsAdding(true);
    addItem(product, variant, 1);
    showCartToast({
      productName: product.name,
      variantName: variant.displayName,
      image,
      quantity: 1,
    });
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
        horizontal && 'w-44 shrink-0 snap-start',
        className
      )}
    >
      <Link
        href={productHref}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes={horizontal ? '176px' : '(max-width: 640px) 50vw, 25vw'}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Sticker rojo de descuento fijo — top-left, flush */}
        {hasDiscount && badge && (
          <div className="absolute left-0 top-2 z-10">
            <DiscountSticker badge={badge} size="sm" />
          </div>
        )}

        {/* Tiered tags — etiquetas escalonadas top-right */}
        {visibleTiers && visibleTiers.length > 0 && (
          <div className="pointer-events-none absolute right-1.5 top-2 z-10 flex flex-col items-end gap-1">
            {visibleTiers.map((tier, i) => (
              <div
                key={i}
                className="tier-tag flex items-center gap-1"
                style={{
                  backgroundColor: TIER_TAG_COLORS[Math.min(i, TIER_TAG_COLORS.length - 1)],
                  transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                }}
              >
                <span className="font-handwriting text-[11px] leading-none text-white">
                  {tier.discount}
                </span>
                <span className="text-[8px] font-medium leading-none text-white/80">
                  {tier.range}
                </span>
              </div>
            ))}
            {tiers && tiers.length > visibleTiers.length && (
              <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white shadow">
                +{tiers.length - visibleTiers.length}
              </span>
            )}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={productHref} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
          {variant.displayName && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
              {variant.displayName}
            </p>
          )}
        </Link>

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tabular-nums text-foreground">
              ${Math.round(finalPrice).toLocaleString('es-CL')}
            </span>
            {hasDiscount && originalPrice > finalPrice && (
              <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                ${Math.round(originalPrice).toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {/* Hint de descuento por mayor — debajo del precio */}
          {tiers && tiers.length > 0 && (
            <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-primary">
              🎉 Hasta {tiers[tiers.length - 1].discount} dcto. por mayor
            </p>
          )}

          {inCart === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding}
              className={cn(
                'tappable mt-2 w-full rounded-full bg-primary py-2 text-sm font-bold text-primary-foreground transition-all',
                'hover:bg-primary/90 active:scale-95 disabled:opacity-60'
              )}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4" />
                Agregar
              </span>
            </button>
          ) : (
            <div className="mt-2 flex items-center justify-between rounded-full bg-primary/10 p-1">
              <button
                type="button"
                onClick={() => updateQuantity(variant._id, inCart - 1)}
                aria-label="Quitar uno"
                className="tappable grid h-8 w-8 place-items-center rounded-full bg-background text-primary shadow-sm hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold tabular-nums text-primary">{inCart}</span>
              <button
                type="button"
                onClick={() => updateQuantity(variant._id, inCart + 1)}
                aria-label="Agregar uno"
                className="tappable grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
