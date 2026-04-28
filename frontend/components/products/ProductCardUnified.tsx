'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCartStore } from '@/store/useCartStore';
import { useProductVariants } from '@/hooks/useProducts';
import { getSafeImageUrl } from '@/lib/image-utils';
import { toast } from 'sonner';
import type { ProductParent, ProductVariant, Brand, Category } from '@/types';
import { cn } from '@/lib/utils';
import { getCategoryPattern } from '@/lib/category-patterns';
import {
  calculateItemDiscount,
  getDiscountBadge,
  getDiscountTiers,
  hasActiveDiscount,
} from '@/lib/discountCalculator';
import { DiscountSticker } from './DiscountSticker';
import { showCartToast } from '@/lib/cart-toast';

/** Color progression for tiered discount tags: cool → hot */
const TIER_TAG_COLORS = [
  '#0ABDC6', // primary teal
  '#3B82F6', // blue
  '#7C3AED', // purple
  '#E63946', // accent red
];

interface ProductCardUnifiedProps {
  product: ProductParent;
  variants?: ProductVariant[];
  /** When true, fetches variants internally (replaces ProductCardWithVariants) */
  autoFetchVariants?: boolean;
  className?: string;
}

export function ProductCardUnified({
  product,
  variants: externalVariants = [],
  autoFetchVariants = false,
  className,
}: ProductCardUnifiedProps) {
  // Auto-fetch variants if needed (absorbs ProductCardWithVariants behavior)
  const { data: fetchedData } = useProductVariants(
    autoFetchVariants ? product._id : ''
  );
  const variants = autoFetchVariants
    ? fetchedData?.data || []
    : externalVariants;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return variants.length > 0 ? variants[0]._id : '';
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  /**
   * Feedback visual del stepper (+/-):
   *  - `stepperTick` remonta la animación en cada click (key change).
   *  - `stepperDir` dispara el delta flotante "+1" o "-1" por encima/debajo.
   */
  const [stepperTick, setStepperTick] = useState(0);
  const [stepperDir, setStepperDir] = useState<'up' | 'down' | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0]._id);
    }
  }, [variants, selectedVariantId]);

  const selectedVariant = variants.find((v) => v._id === selectedVariantId) || variants[0];

  const quantityInCart = selectedVariant
    ? cartItems.find((item) => item.variantId === selectedVariant._id)?.quantity || 0
    : 0;

  const getDisplayName = (variant: ProductVariant | undefined) => {
    if (!variant) return '';
    if (variant.displayName) return variant.displayName;
    const attrs = Object.entries(variant.attributes || {})
      .map(([, value]) => value)
      .join(' - ');
    return attrs || variant.sku;
  };

  const mainImage = getSafeImageUrl(
    selectedVariant?.images?.[0] || product.images?.[0],
    { width: 400, height: 400, quality: 'auto' }
  );

  const hasDiscount = selectedVariant ? hasActiveDiscount(selectedVariant, product) : false;
  const discountBadge = selectedVariant ? getDiscountBadge(selectedVariant, product) : null;

  const priceInfo = selectedVariant
    ? calculateItemDiscount(selectedVariant, 1, product)
    : null;

  const displayPrice = priceInfo?.finalPrice || selectedVariant?.price || 0;
  const originalPrice = priceInfo?.originalPrice || selectedVariant?.price || 0;
  const hasFixedDiscountApplied = priceInfo?.appliedFixedDiscount !== null;

  const tiers = selectedVariant ? getDiscountTiers(selectedVariant, product) : null;

  // Extract brand name
  const brandName =
    typeof product.brand === 'object' && product.brand !== null
      ? (product.brand as Brand).name
      : typeof product.brand === 'string'
        ? product.brand
        : null;

  // Extract category colors for dynamic top border
  const categoryColors = (product.categories || [])
    .map((cat) => (typeof cat === 'object' && cat !== null ? (cat as Category).color : null))
    .filter((c): c is string => Boolean(c));

  const topBorderStyle = categoryColors.length >= 2
    ? { borderTopColor: 'transparent', backgroundImage: `linear-gradient(to right, ${categoryColors[0]}, ${categoryColors[1]})`, backgroundSize: '100% 3px', backgroundRepeat: 'no-repeat', backgroundPosition: 'top' }
    : categoryColors.length === 1
      ? { borderTopColor: categoryColors[0] }
      : undefined;

  const patternStyle = categoryColors.length > 0
    ? getCategoryPattern(categoryColors[0])
    : undefined;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      addItem(product, selectedVariant, 1);
      showCartToast({
        product,
        variant: selectedVariant,
        quantity: 1,
        pricePerUnit: priceInfo?.finalPrice ?? selectedVariant.price,
        variantLabel: product.hasVariants ? getDisplayName(selectedVariant) : null,
      });
    } catch (error) {
      toast.error('No pudimos agregar el producto', {
        description: 'Intentá de nuevo en un momento.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = () => {
    if (!selectedVariant) return;
    updateQuantity(selectedVariant._id, quantityInCart + 1);
    setStepperDir('up');
    setStepperTick((t) => t + 1);
  };

  const handleDecrement = () => {
    if (!selectedVariant) return;
    updateQuantity(selectedVariant._id, quantityInCart - 1);
    setStepperDir('down');
    setStepperTick((t) => t + 1);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos');
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col h-full',
        'bg-card rounded-lg overflow-hidden',
        'border border-border',
        'border-t-[3px]',
        categoryColors.length === 0 && 'border-t-primary',
        categoryColors.length >= 2 && 'border-t-transparent',
        'shadow-sm hover:shadow-md',
        'transition-all duration-150',
        'hover:-translate-y-0.5',
        !selectedVariant?.active && 'opacity-60',
        className
      )}
      style={topBorderStyle}
    >
      {/* Image */}
      <Link href={`/productos/${product.slug}`} className="block relative">
        <div className="aspect-[5/4] relative overflow-hidden category-pattern-overlay px-[15%]" style={patternStyle}>
          <div className="relative z-[1] w-full h-full rounded-t-lg overflow-hidden">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-contain object-bottom transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
          </div>

          {/* Favorite */}
          <button
            onClick={toggleFavorite}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 z-10',
              isFavorite
                ? 'bg-accent text-white scale-110'
                : 'bg-black/20 text-white/70 hover:text-accent hover:bg-white opacity-0 group-hover:opacity-100'
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </button>

          {/* Fixed Discount Badge — flush top-left, sticker style (dimak) */}
          {hasDiscount && discountBadge && (
            <div className="absolute top-2 left-0 z-10">
              <DiscountSticker badge={discountBadge} size="md" />
            </div>
          )}

          {/* Tiered Discount Tags — etiquetas de confitería */}
          {tiers && tiers.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 items-end">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className="tier-tag flex items-center gap-1.5"
                  style={{
                    backgroundColor: TIER_TAG_COLORS[Math.min(i, TIER_TAG_COLORS.length - 1)],
                    transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                  }}
                >
                  <span className="text-handwriting text-xs text-white">{tier.discount}</span>
                  <span className="text-[8px] text-white/70 font-medium">{tier.range}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 pt-0 pb-3">
        <div className="flex-1 space-y-0.5">
          {/* Brand */}
          {brandName && (
            <span className="block font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {brandName}
            </span>
          )}

          {/* Product Name + format + variant inline */}
          <Link href={`/productos/${product.slug}`}>
            <h3 className="font-display text-sm font-medium text-card-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
              {product.name}
              {product.hasVariants && selectedVariant && (
                <span className="font-normal text-muted-foreground"> · {getDisplayName(selectedVariant)}</span>
              )}
            </h3>
          </Link>

          {/* Variant Selector */}
          {product.hasVariants && variants.length > 1 && selectedVariantId && (
            <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
              <SelectTrigger className="h-7 w-full text-xs bg-muted border-border text-foreground rounded-md transition-colors">
                <SelectValue>
                  {getDisplayName(selectedVariant)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-lg">
                {variants.map((variant) => (
                  <SelectItem
                    key={variant._id}
                    value={variant._id}
                    className="text-popover-foreground rounded-md"
                  >
                    {getDisplayName(variant)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Price + Cart Controls — horizontal row */}
        <div className="mt-2.5 flex items-center gap-2">
          {/* Price — sólo precio final; el badge rojo (sticker) ya comunica el descuento */}
          <div className="flex items-baseline min-w-0 flex-shrink">
            <span className="font-sans text-base font-bold text-primary whitespace-nowrap" suppressHydrationWarning>
              ${displayPrice.toLocaleString('es-CL')}
            </span>
          </div>

          {/* Cart button / quantity stepper — right side */}
          <div className="ml-auto flex-shrink-0">
            {quantityInCart > 0 ? (
              <div
                key={`stepper-${stepperTick}`}
                className="relative flex items-center h-8 rounded-lg overflow-hidden border border-primary/30 stepper-flash"
              >
                <button
                  onClick={handleDecrement}
                  className="flex items-center justify-center w-8 h-full text-card-foreground hover:bg-primary/10 transition-colors active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span
                  key={`qty-${stepperTick}`}
                  className="w-7 text-center text-sm font-bold text-card-foreground stepper-bump inline-block"
                >
                  {quantityInCart}
                </span>
                <button
                  onClick={handleIncrement}
                  className="flex items-center justify-center w-8 h-full text-card-foreground hover:bg-primary/10 transition-colors active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>

                {/* Delta flotante: +1 sale hacia arriba, -1 hacia abajo */}
                {stepperDir && (
                  <span
                    key={`delta-${stepperTick}`}
                    className={cn(
                      'pointer-events-none absolute left-1/2 text-xs font-bold select-none',
                      stepperDir === 'up'
                        ? 'top-0 text-primary delta-float-up'
                        : 'bottom-0 text-accent delta-float-down'
                    )}
                    aria-hidden="true"
                  >
                    {stepperDir === 'up' ? '+1' : '−1'}
                  </span>
                )}
              </div>
            ) : (
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || !selectedVariant}
                size="sm"
                className="h-8 px-3 font-bold text-xs rounded-lg bg-primary hover:bg-primary/90 text-white transition-all duration-150 active:scale-[0.98]"
              >
                {isAdding ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                    Agregar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
