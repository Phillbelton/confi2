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

  // Calculate if has discount
  const hasActiveDiscount = product.tieredDiscounts?.some(
    (d) => d.active && (!d.endDate || new Date(d.endDate) > new Date())
  );

  // Get tiered discount badge text
  const getTieredDiscountBadge = () => {
    if (!hasActiveDiscount) return null;

    const discount = product.tieredDiscounts.find((d) => d.active);
    if (!discount || !discount.tiers.length) return null;

    const minTier = discount.tiers[0];
    if (!selectedVariant) return null;

    const discountedPrice = selectedVariant.price - (selectedVariant.price * minTier.value) / 100;

    return `Desde ${minTier.minQuantity} un $${discountedPrice.toLocaleString()} c/u`;
  };

  // Get discount tiers for tooltip
  const getDiscountTiers = () => {
    if (!hasActiveDiscount || !selectedVariant) return null;

    const discount = product.tieredDiscounts.find((d) => d.active);
    if (!discount || !discount.tiers.length) return null;

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

          {/* Tiered Discount Badge */}
          {hasActiveDiscount && !isOutOfStock && (
            <div className="absolute top-2 right-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-accent text-accent-foreground pulse-badge cursor-help">
                      {getTieredDiscountBadge()}
                    </Badge>
                  </TooltipTrigger>
                  {discountTiers && (
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
                    {variant.displayName} - ${variant.price.toLocaleString()}
                    {variant.stock === 0 && ' (Agotado)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Price */}
        {selectedVariant && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${selectedVariant.price.toLocaleString()}
            </span>
            {selectedVariant.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${selectedVariant.compareAtPrice.toLocaleString()}
              </span>
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
