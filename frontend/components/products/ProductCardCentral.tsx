'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Check } from 'lucide-react';
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
  hasActiveDiscount,
} from '@/lib/discountCalculator';

interface ProductCardCentralProps {
  product: ProductParent;
  variants?: ProductVariant[];
  className?: string;
}

export function ProductCardCentral({ product, variants = [], className }: ProductCardCentralProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Sync selectedVariantId when variants change or component mounts
  useEffect(() => {
    if (variants.length > 0) {
      // Always set to first variant if we don't have a valid selection
      const currentVariant = variants.find((v) => v._id === selectedVariantId);
      if (!currentVariant) {
        setSelectedVariantId(variants[0]._id);
      }
    }
  }, [variants, selectedVariantId]);

  // Get selected variant or first variant
  const selectedVariant = variants.find((v) => v._id === selectedVariantId) || variants[0];

  // Generate displayName if not provided by backend
  const getDisplayName = (variant: ProductVariant | undefined) => {
    if (!variant) return '';
    if (variant.displayName) return variant.displayName;

    // Fallback: generate from attributes
    const attrs = Object.entries(variant.attributes || {})
      .map(([key, value]) => value)
      .join(' - ');
    return attrs || variant.sku;
  };

  // Debug log (temporary)
  useEffect(() => {
    if (product.hasVariants && variants.length > 0) {
      console.log('ProductCard Debug:', {
        productName: product.name,
        variantsCount: variants.length,
        selectedVariantId,
        selectedVariant: selectedVariant ? {
          id: selectedVariant._id,
          displayName: getDisplayName(selectedVariant),
          attributes: selectedVariant.attributes
        } : null,
        allVariants: variants.map(v => ({
          id: v._id,
          displayName: getDisplayName(v),
          attributes: v.attributes
        }))
      });
    }
  }, [selectedVariantId, variants]);

  // Check if out of stock
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  // Get first image
  const mainImage = getSafeImageUrl(
    selectedVariant?.images?.[0] || product.images?.[0],
    { width: 400, height: 400, quality: 'auto' }
  );

  // Use unified discount calculator
  const hasDiscount = selectedVariant ? hasActiveDiscount(selectedVariant, product) : false;
  const discountBadge = selectedVariant ? getDiscountBadge(selectedVariant, product) : null;

  // Calculate discounted price for display
  const priceInfo = selectedVariant
    ? calculateItemDiscount(selectedVariant, 1, product)
    : null;

  const displayPrice = priceInfo?.finalPrice || selectedVariant?.price || 0;
  const originalPrice = priceInfo?.originalPrice || selectedVariant?.price || 0;
  const hasFixedDiscountApplied = priceInfo?.appliedFixedDiscount !== null;

  // Calculate price per unit/liter (example calculation)
  const pricePerUnit = displayPrice; // Could be calculated based on product attributes

  // Get minimum purchase quantity (from tiered discount if available)
  const minPurchase = selectedVariant?.tieredDiscount?.tiers?.[0]?.minQuantity || 1;

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      addItem(product, selectedVariant, minPurchase);

      setJustAdded(true);
      toast.success('Producto agregado al carrito', {
        description: `${product.name}${
          product.hasVariants ? ` - ${getDisplayName(selectedVariant)}` : ''
        }`,
      });

      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      toast.error('Error al agregar el producto');
    } finally {
      setIsAdding(false);
    }
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
        'group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow',
        isOutOfStock && 'opacity-70',
        className
      )}
    >
      {/* Image Container */}
      <Link href={`/productos/${product.slug}`} className="block relative">
        <div className="aspect-square relative overflow-hidden bg-gray-100 p-4">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10',
              isFavorite
                ? 'bg-primary text-white'
                : 'bg-white/80 text-gray-400 hover:text-primary hover:bg-white'
            )}
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
          </button>

          {/* Discount Badge */}
          {hasDiscount && discountBadge && !isOutOfStock && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground font-bold">
              {discountBadge}
            </Badge>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Agotado
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${displayPrice.toLocaleString('es-CL')}
            </span>
            {hasFixedDiscountApplied && (
              <span className="text-sm text-gray-400 line-through">
                ${originalPrice.toLocaleString('es-CL')}
              </span>
            )}
          </div>
        </div>

        {/* Product Name */}
        <Link href={`/productos/${product.slug}`}>
          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 hover:text-primary transition-colors uppercase">
            {product.name}
            {product.hasVariants && selectedVariant && (
              <span className="font-normal"> - {getDisplayName(selectedVariant)}</span>
            )}
          </h3>
        </Link>

        {/* Variant Selector */}
        {product.hasVariants && variants.length > 1 && selectedVariantId && (
          <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
            <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200">
              <SelectValue placeholder="Seleccionar formato" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => (
                <SelectItem key={variant._id} value={variant._id}>
                  {getDisplayName(variant)}
                  {variant.stock === 0 && ' (Agotado)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Price Per Unit */}
        <p className="text-xs text-gray-500">
          ${pricePerUnit.toLocaleString('es-CL')} por UN
        </p>

        {/* Minimum Purchase */}
        {minPurchase > 1 && (
          <p className="text-xs text-gray-500">
            Compra mínima {minPurchase} un
          </p>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
          className={cn(
            'w-full h-10 font-semibold transition-all',
            justAdded
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-primary hover:bg-primary/90 text-white'
          )}
        >
          {justAdded ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Agregado
            </>
          ) : isAdding ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Agregando...
            </>
          ) : isOutOfStock ? (
            'Agotado'
          ) : (
            <>
              Agregar
              <ShoppingCart className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
