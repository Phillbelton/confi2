'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Check, Eye, Plus, Minus, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface ProductCardEnhancedProps {
  product: ProductParent;
  variants?: ProductVariant[];
  className?: string;
  onQuickView?: () => void;
}

export function ProductCardEnhanced({
  product,
  variants = [],
  className,
  onQuickView,
}: ProductCardEnhancedProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?._id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Get selected variant or first variant
  const selectedVariant = variants.find((v) => v._id === selectedVariantId) || variants[0];

  // Check if product is new (created in last 7 days)
  const isNew =
    new Date().getTime() - new Date(product.createdAt).getTime() <
    7 * 24 * 60 * 60 * 1000;

  // Check if out of stock
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  // Get first image: use variant image if available, otherwise use parent image
  const mainImage = getSafeImageUrl(
    selectedVariant?.images?.[0] || product.images?.[0]
  );

  // Use unified discount calculator
  const hasDiscount = selectedVariant ? hasActiveDiscount(selectedVariant, product) : false;
  const discountBadge = selectedVariant ? getDiscountBadge(selectedVariant, product) : null;
  const discountTiers = selectedVariant ? getDiscountTiers(selectedVariant, product) : null;

  // Calculate discounted price for display (quantity = 1 for display)
  const priceInfo = selectedVariant
    ? calculateItemDiscount(selectedVariant, 1, product)
    : null;

  const displayPrice = priceInfo?.finalPrice || selectedVariant?.price || 0;
  const originalPrice = priceInfo?.originalPrice || selectedVariant?.price || 0;
  const hasFixedDiscountApplied = priceInfo?.appliedFixedDiscount !== null;

  // Mock rating (you can replace with actual rating from backend)
  const rating = 4.5;
  const reviewCount = 234;

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      // Simulate network delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      addItem(product, selectedVariant, quantity);

      // Show success state
      setJustAdded(true);
      toast.success('Producto agregado al carrito', {
        description: `${quantity}x ${product.name} ${
          product.hasVariants ? `- ${selectedVariant.displayName}` : ''
        }`,
      });

      // Reset quantity and success state
      setTimeout(() => {
        setJustAdded(false);
        setQuantity(1);
      }, 2000);
    } catch (error) {
      toast.error('Error al agregar el producto');
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:shadow-xl border-border/50',
        isOutOfStock && 'opacity-60',
        className
      )}
    >
      {/* Image Section */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        <Link href={`/productos/${product.slug}`}>
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </Link>

        {/* Quick View Button - Shows on hover */}
        {onQuickView && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={onQuickView}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && (
            <Badge className="bg-secondary text-secondary-foreground shadow-md">
              ⭐ Destacado
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-green-500 text-white shadow-md">🆕 Nuevo</Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="shadow-md">
              Agotado
            </Badge>
          )}
          {hasDiscount && !isOutOfStock && discountBadge && (
            <Badge className="bg-destructive text-destructive-foreground pulse-badge shadow-md">
              {discountBadge}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-3 space-y-2">
        {/* Product Name */}
        <Link href={`/productos/${product.slug}`}>
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Variant Selector */}
        {product.hasVariants && variants.length > 0 && (
          <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => (
                <SelectItem key={variant._id} value={variant._id}>
                  {variant.displayName}
                  {variant.stock === 0 && ' (Agotado)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Price */}
        {selectedVariant && (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">
                ${displayPrice.toLocaleString()}
              </span>
              {hasFixedDiscountApplied && (
                <span className="text-xs text-muted-foreground line-through">
                  ${originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {rating} ({reviewCount})
          </span>
        </div>

        {/* Tier Discount Badges - Horizontal Scroll */}
        {discountTiers && discountTiers.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {discountTiers.map((tier, index) => {
              const minQty = tier.range.split('-')[0].split('+')[0].trim();
              return (
                <div
                  key={index}
                  className="flex-shrink-0 flex flex-col items-center justify-center px-2 py-1 rounded-md border border-accent/30 bg-accent/5 min-w-[55px]"
                >
                  <span className="text-[9px] text-accent-foreground/60 font-medium leading-tight whitespace-nowrap">
                    {minQty}+
                  </span>
                  <span className="text-[10px] text-accent-foreground font-bold leading-tight">
                    {tier.price}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Quantity Selector */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={incrementQuantity}
              disabled={!selectedVariant || quantity >= selectedVariant.stock}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
            className="flex-1 h-8 text-xs"
            size="sm"
            variant={justAdded ? 'outline' : 'default'}
          >
            {justAdded ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Agregado
              </>
            ) : isAdding ? (
              <>
                <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ...
              </>
            ) : isOutOfStock ? (
              'Agotado'
            ) : (
              <>
                <ShoppingCart className="mr-1 h-3 w-3" />
                Agregar
              </>
            )}
          </Button>
        </div>

        {/* Stock info */}
        {selectedVariant && selectedVariant.isLowStock && !isOutOfStock && (
          <p className="text-[10px] text-amber-600 font-medium">
            ¡Solo quedan {selectedVariant.stock}!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
