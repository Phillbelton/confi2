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
import type { ProductParent, ProductVariant, Brand } from '@/types';
import { cn } from '@/lib/utils';
import {
  calculateItemDiscount,
  getDiscountBadge,
  getDiscountTiers,
  hasActiveDiscount,
} from '@/lib/discountCalculator';

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

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      addItem(product, selectedVariant, 1);
      toast.success('Producto agregado al carrito', {
        description: `${product.name}${
          product.hasVariants ? ` - ${getDisplayName(selectedVariant)}` : ''
        }`,
      });
    } catch (error) {
      toast.error('Error al agregar el producto');
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = () => {
    if (!selectedVariant) return;
    updateQuantity(selectedVariant._id, quantityInCart + 1);
  };

  const handleDecrement = () => {
    if (!selectedVariant) return;
    updateQuantity(selectedVariant._id, quantityInCart - 1);
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
        'shadow-sm hover:shadow-md',
        'transition-all duration-150',
        'hover:-translate-y-0.5',
        !selectedVariant?.active && 'opacity-60',
        className
      )}
    >
      {/* Image */}
      <Link href={`/productos/${product.slug}`} className="block relative">
        <div className="aspect-square relative overflow-hidden bg-white px-[15%]">
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
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

          {/* Fixed Discount Badge — top left */}
          {hasDiscount && discountBadge && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-accent text-white font-bold text-[11px] leading-none px-2 py-1.5 rounded-md shadow-sm">
                {discountBadge}
              </div>
            </div>
          )}

          {/* Tiered Discount Badges — top right */}
          {tiers && tiers.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 items-end">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-amber-500 shadow-sm"
                >
                  <span className="text-[9px] sm:text-[10px] text-white/80 font-medium">{tier.range}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white">{tier.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 pb-3">
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
          {/* Price */}
          <div className="flex items-baseline gap-1.5 min-w-0 flex-shrink">
            <span className="font-sans text-base font-bold text-primary whitespace-nowrap" suppressHydrationWarning>
              ${displayPrice.toLocaleString('es-CL')}
            </span>
            {hasFixedDiscountApplied && (
              <span className="font-sans text-[11px] text-muted-foreground line-through whitespace-nowrap" suppressHydrationWarning>
                ${originalPrice.toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {/* Cart button / quantity stepper — right side */}
          <div className="ml-auto flex-shrink-0">
            {quantityInCart > 0 ? (
              <div className="flex items-center h-8 rounded-lg overflow-hidden border border-primary/30 bg-primary/5">
                <button
                  onClick={handleDecrement}
                  className="flex items-center justify-center w-8 h-full text-card-foreground hover:bg-primary/10 transition-colors active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-bold text-card-foreground">
                  {quantityInCart}
                </span>
                <button
                  onClick={handleIncrement}
                  className="flex items-center justify-center w-8 h-full text-card-foreground hover:bg-primary/10 transition-colors active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
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
