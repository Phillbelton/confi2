'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCartStore } from '@/store/useCartStore';
import { getSafeImageUrl } from '@/lib/image-utils';
import { toast } from 'sonner';
import type { ProductParent, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: ProductParent;
  variants?: ProductVariant[];
  className?: string;
}

export function ProductCard({ product, variants = [], className }: ProductCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?._id || ''
  );
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

  // Check if variant has active fixed discount
  const hasFixedDiscount = selectedVariant?.fixedDiscount?.enabled &&
    (!selectedVariant.fixedDiscount.startDate || new Date(selectedVariant.fixedDiscount.startDate) <= new Date()) &&
    (!selectedVariant.fixedDiscount.endDate || new Date(selectedVariant.fixedDiscount.endDate) >= new Date());

  // Check if variant has active tiered discount
  const hasVariantTieredDiscount = selectedVariant?.tieredDiscount?.active &&
    selectedVariant.tieredDiscount.tiers.length > 0 &&
    (!selectedVariant.tieredDiscount.startDate || new Date(selectedVariant.tieredDiscount.startDate) <= new Date()) &&
    (!selectedVariant.tieredDiscount.endDate || new Date(selectedVariant.tieredDiscount.endDate) >= new Date());

  // Check if parent has active tiered discount (legacy)
  const hasParentTieredDiscount = product.tieredDiscounts?.some(
    (d) => d.active && (!d.endDate || new Date(d.endDate) > new Date())
  );

  const hasAnyDiscount = hasFixedDiscount || hasVariantTieredDiscount || hasParentTieredDiscount;

  // Calculate discounted price for display (ONLY fixed discount, not tiered)
  // Tiered discounts are shown separately in badges since they depend on quantity
  const getDiscountedPrice = () => {
    if (!selectedVariant) return null;

    // Only apply fixed discount for the main price display
    if (hasFixedDiscount) {
      let fixedDiscount = 0;
      if (selectedVariant.fixedDiscount!.type === 'percentage') {
        fixedDiscount = (selectedVariant.price * selectedVariant.fixedDiscount!.value) / 100;
      } else {
        fixedDiscount = selectedVariant.fixedDiscount!.value;
      }
      return selectedVariant.price - fixedDiscount;
    }

    return null;
  };

  // Get discount badge text
  const getDiscountBadge = () => {
    if (hasFixedDiscount) {
      const badge = selectedVariant?.fixedDiscount?.badge;
      if (badge) return badge;

      const value = selectedVariant!.fixedDiscount!.value;
      return selectedVariant!.fixedDiscount!.type === 'percentage'
        ? `-${value}%`
        : `-$${value.toLocaleString()}`;
    }

    if (hasVariantTieredDiscount) {
      const badge = selectedVariant?.tieredDiscount?.badge;
      if (badge) return badge;

      // Calculate price with first tier (considering fixed discount if present)
      const tiers = getDiscountTiers();
      if (tiers && tiers.length > 0) {
        const minTier = selectedVariant!.tieredDiscount!.tiers[0];
        return `Desde ${minTier.minQuantity} un ${tiers[0].price} c/u`;
      }
    }

    if (hasParentTieredDiscount && selectedVariant) {
      const discount = product.tieredDiscounts.find((d) => d.active);
      if (discount?.tiers.length) {
        const minTier = discount.tiers[0];
        const discountAmount = (selectedVariant.price * minTier.value) / 100;
        const finalPrice = selectedVariant.price - discountAmount;
        return `Desde ${minTier.minQuantity} un $${finalPrice.toLocaleString()} c/u`;
      }
    }

    return null;
  };

  // Get discount tiers for tooltip and badges
  const getDiscountTiers = () => {
    if (!selectedVariant) return null;

    // Calculate base price after fixed discount (if any)
    let basePrice = selectedVariant.price;
    if (hasFixedDiscount) {
      if (selectedVariant.fixedDiscount!.type === 'percentage') {
        basePrice -= (basePrice * selectedVariant.fixedDiscount!.value) / 100;
      } else {
        basePrice -= selectedVariant.fixedDiscount!.value;
      }
    }

    // Show variant tiered discount tiers (applied on price after fixed discount)
    if (hasVariantTieredDiscount) {
      return selectedVariant.tieredDiscount!.tiers.map((tier) => {
        let discountAmount = 0;
        if (tier.type === 'percentage') {
          discountAmount = (basePrice * tier.value) / 100;
        } else {
          discountAmount = tier.value;
        }
        const finalPrice = basePrice - discountAmount;

        return {
          range: tier.maxQuantity
            ? `${tier.minQuantity}-${tier.maxQuantity} un`
            : `${tier.minQuantity}+ un`,
          price: `$${finalPrice.toLocaleString()}`,
          discount: tier.type === 'percentage' ? `${tier.value}%` : `$${tier.value}`,
        };
      });
    }

    // Show parent tiered discount tiers (legacy - only if no fixed discount)
    if (hasParentTieredDiscount) {
      const discount = product.tieredDiscounts.find((d) => d.active);
      if (discount?.tiers.length) {
        return discount.tiers.map((tier) => {
          const discountAmount = (selectedVariant.price * tier.value) / 100;
          const finalPrice = selectedVariant.price - discountAmount;

          return {
            range: tier.maxQuantity
              ? `${tier.minQuantity}-${tier.maxQuantity} un`
              : `${tier.minQuantity}+ un`,
            price: `$${finalPrice.toLocaleString()}`,
            discount: `${tier.value}%`,
          };
        });
      }
    }

    return null;
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      // Simulate network delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      addItem(product, selectedVariant, 1);

      // Show success state
      setJustAdded(true);
      toast.success('Producto agregado al carrito', {
        description: `${product.name} ${
          product.hasVariants ? `- ${selectedVariant.displayName}` : ''
        }`,
      });

      // Reset success state after 2 seconds
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      toast.error('Error al agregar el producto');
    } finally {
      setIsAdding(false);
    }
  };

  const discountTiers = getDiscountTiers();

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover-scale hover:shadow-lg',
        isOutOfStock && 'opacity-60',
        className
      )}
    >
      <Link href={`/productos/${product.slug}`}>
        <div className="aspect-square relative overflow-hidden bg-muted">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge className="bg-secondary text-secondary-foreground">
                Destacado
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-success text-success-foreground">Nuevo</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive">Agotado</Badge>
            )}
          </div>

          {/* Discount Badge */}
          {hasAnyDiscount && !isOutOfStock && (
            <div className="absolute top-2 right-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-accent text-accent-foreground pulse-badge cursor-help">
                      {getDiscountBadge()}
                    </Badge>
                  </TooltipTrigger>
                  {discountTiers && discountTiers.length > 0 && (
                    <TooltipContent side="left" className="p-3">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">
                          Descuentos por cantidad:
                        </p>
                        <div className="space-y-1">
                          {discountTiers.map((tier, index) => (
                            <div
                              key={index}
                              className="flex justify-between gap-4 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {tier.range}
                              </span>
                              <span className="font-semibold">{tier.price}</span>
                              <span className="text-success">-{tier.discount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/productos/${product.slug}`}>
          {/* Brand */}
          {typeof product.brand === 'object' && product.brand && (
            <p className="text-xs text-muted-foreground mb-1">
              {product.brand.name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Variant Selector */}
        {product.hasVariants && variants.length > 0 && (
          <div className="mb-3">
            <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
              <SelectTrigger className="h-8 text-xs">
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
          </div>
        )}

        {/* Price */}
        {selectedVariant && (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                ${(getDiscountedPrice() || selectedVariant.price).toLocaleString()}
              </span>
              {getDiscountedPrice() && (
                <span className="text-sm text-muted-foreground line-through">
                  ${selectedVariant.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Tier Discount Badges */}
            {(hasVariantTieredDiscount || hasParentTieredDiscount) && discountTiers && discountTiers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {discountTiers.slice(0, 3).map((tier, index) => {
                  // Extract min quantity from range (e.g., "2-5 un" -> "2", "6+ un" -> "6")
                  const minQty = tier.range.split('-')[0].split('+')[0].trim();

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-center px-2 py-1 rounded-md border border-accent/20 bg-accent/10 min-w-[60px]"
                    >
                      <span className="text-[9px] text-accent-foreground/70 font-medium leading-tight">
                        desde {minQty}
                      </span>
                      <span className="text-[11px] text-accent-foreground font-bold leading-tight">
                        {tier.price}
                      </span>
                    </div>
                  );
                })}
                {discountTiers.length > 3 && (
                  <div className="flex items-center justify-center px-2 py-1 rounded-md border border-muted bg-muted/50 min-w-[50px]">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      +{discountTiers.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stock info */}
        {selectedVariant && selectedVariant.isLowStock && !isOutOfStock && (
          <p className="text-xs text-amber-600 mt-1">
            ¡Últimas {selectedVariant.stock} unidades!
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
          className="w-full touch-target"
          variant={justAdded ? 'outline' : 'default'}
        >
          {justAdded ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Agregado
            </>
          ) : isAdding ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Agregando...
            </>
          ) : isOutOfStock ? (
            'Agotado'
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Agregar al carrito
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
