'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCartStore } from '@/store/useCartStore';
import { getSafeImageUrl } from '@/lib/image-utils';
import { toast } from 'sonner';
import type { ProductParent, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';
import {
  calculateItemDiscount,
  getDiscountBadge,
  getDiscountTiers,
  hasActiveDiscount,
} from '@/lib/discountCalculator';

interface ProductCardCentralProps {
  product: ProductParent;
  variants?: ProductVariant[];
  className?: string;
}

export function ProductCardCentral({ product, variants = [], className }: ProductCardCentralProps) {
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

  // Reactively derive quantity from cart items
  const quantityInCart = selectedVariant
    ? cartItems.find((item) => item.variantId === selectedVariant._id)?.quantity || 0
    : 0;

  const getDisplayName = (variant: ProductVariant | undefined) => {
    if (!variant) return '';
    if (variant.displayName) return variant.displayName;
    const attrs = Object.entries(variant.attributes || {})
      .map(([key, value]) => value)
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
        'bg-white/[0.08] backdrop-blur-md',
        'border border-white/[0.12] hover:border-primary/40',
        'rounded-2xl overflow-hidden',
        'shadow-lg shadow-black/15 hover:shadow-xl hover:shadow-primary/10',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1',
        !selectedVariant?.active && 'opacity-60',
        className
      )}
    >
      {/* Image */}
      <Link href={`/productos/${product.slug}`} className="block relative">
        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[1]" />

          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-contain p-1 transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Quick View on hover */}
          <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-[2]">
            <span className="px-3 py-1.5 rounded-full bg-white/90 text-secondary text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <Eye className="h-3.5 w-3.5" />
              Ver producto
            </span>
          </div>

          {/* Favorite */}
          <button
            onClick={toggleFavorite}
            className={cn(
              'absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10',
              isFavorite
                ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-110'
                : 'bg-black/30 backdrop-blur-sm text-white/70 hover:text-accent hover:bg-black/50 opacity-0 group-hover:opacity-100'
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </button>

          {/* Discount Badge — top left */}
          {hasDiscount && discountBadge && (
            <Badge className="absolute top-2.5 left-2.5 bg-accent text-white font-bold text-xs shadow-lg shadow-accent/30 rounded-lg px-2 py-0.5 z-10">
              {discountBadge}
            </Badge>
          )}

          {/* Tiered Discounts — right edge, vertical stack */}
          {tiers && tiers.length > 0 && (
            <div className="absolute right-1.5 bottom-2 flex flex-col gap-1 z-10 items-end">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-1.5 py-[3px] rounded-lg bg-secondary/80 backdrop-blur-sm border border-white/10 shadow-md"
                >
                  <span className="text-[9px] sm:text-[10px] text-white/50 font-medium">{tier.range}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-cyan-200">{tier.price}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </Link>

      {/* Content — reduced top padding for closer proximity to image */}
      <div className="flex flex-col flex-1 px-3 pt-2 pb-3 sm:px-3.5 sm:pb-3.5">
        <div className="flex-1 space-y-1.5">
          {/* Product Name */}
          <Link href={`/productos/${product.slug}`}>
            <h3 className="font-display font-bold text-sm sm:text-[15px] text-white/90 line-clamp-2 hover:text-cyan-200 transition-colors leading-snug">
              {product.name}
              {product.hasVariants && selectedVariant && (
                <span className="font-sans font-normal text-white/40"> · {getDisplayName(selectedVariant)}</span>
              )}
            </h3>
          </Link>

          {/* Price */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-display font-extrabold text-white">
              ${displayPrice.toLocaleString('es-CL')}
            </span>
            {hasFixedDiscountApplied && (
              <span className="text-xs text-white/30 line-through decoration-accent/50">
                ${originalPrice.toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {product.hasVariants && variants.length > 1 && selectedVariantId && (
            <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
              <SelectTrigger className="h-7 w-full text-xs bg-white/[0.06] border-white/10 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                <SelectValue>
                  {getDisplayName(selectedVariant)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10 rounded-xl">
                {variants.map((variant) => (
                  <SelectItem
                    key={variant._id}
                    value={variant._id}
                    className="text-gray-200 focus:bg-white/10 focus:text-white rounded-lg"
                  >
                    {getDisplayName(variant)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

        </div>

        {/* Cart Controls */}
        <div className="mt-2.5 sm:mt-3">
          {quantityInCart > 0 ? (
            /* Quantity controls — product is in cart */
            <div className="flex items-center h-9 rounded-xl overflow-hidden border border-primary/30 bg-primary/10">
              <button
                onClick={handleDecrement}
                className="flex items-center justify-center w-10 h-full text-white hover:bg-white/10 transition-colors active:scale-95"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex-1 flex items-center justify-center gap-1 text-sm font-display font-bold text-white">
                <span>{quantityInCart}</span>
                <span className="text-white/40 font-normal text-xs">en carrito</span>
              </div>
              <button
                onClick={handleIncrement}
                className="flex items-center justify-center w-10 h-full text-white hover:bg-white/10 transition-colors active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Add to cart button */
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || !selectedVariant}
              className="w-full h-9 font-display font-bold text-sm rounded-xl transition-all duration-200 bg-primary hover:bg-primary/80 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              {isAdding ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  Agregar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
