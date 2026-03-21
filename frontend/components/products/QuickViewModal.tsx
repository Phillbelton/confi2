'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Check, ChevronLeft, ChevronRight, Star, Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/useCartStore';
import { getSafeImageUrl } from '@/lib/image-utils';
import { toast } from 'sonner';
import type { ProductParent, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';
import {
  calculateItemDiscount,
  getDiscountTiers,
  hasActiveDiscount,
} from '@/lib/discountCalculator';

interface QuickViewModalProps {
  product: ProductParent | null;
  variants?: ProductVariant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewModal({
  product,
  variants = [],
  open,
  onOpenChange,
}: QuickViewModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Reset state when product changes
  useEffect(() => {
    if (product && variants.length > 0) {
      setSelectedVariantId(variants[0]._id);
      setQuantity(1);
      setCurrentImageIndex(0);
    }
  }, [product, variants]);

  if (!product) return null;

  const selectedVariant = variants.find((v) => v._id === selectedVariantId) || variants[0];
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  // Get images for gallery
  const images = selectedVariant?.images || product.images || [];
  const currentImage = getSafeImageUrl(images[currentImageIndex]);

  // Discount calculations
  const hasDiscount = selectedVariant ? hasActiveDiscount(selectedVariant, product) : false;
  const discountTiers = selectedVariant ? getDiscountTiers(selectedVariant, product) : null;
  const priceInfo = selectedVariant
    ? calculateItemDiscount(selectedVariant, quantity, product)
    : null;

  const displayPrice = priceInfo?.finalPrice || selectedVariant?.price || 0;
  const originalPrice = priceInfo?.originalPrice || selectedVariant?.price || 0;
  const unitPrice = selectedVariant?.price || 0;
  const hasFixedDiscountApplied = priceInfo?.appliedFixedDiscount !== null;

  // Mock rating
  const rating = 4.5;
  const reviewCount = 234;

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      addItem(product, selectedVariant, quantity);

      setJustAdded(true);
      toast.success('Producto agregado al carrito', {
        description: `${quantity}x ${product.name} ${
          product.hasVariants ? `- ${selectedVariant.displayName}` : ''
        }`,
      });

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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-bold pr-8">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 px-6 pb-6">
          {/* Left Column - Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 shadow-lg"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 shadow-lg"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        index === currentImageIndex
                          ? 'bg-primary w-4'
                          : 'bg-white/50 hover:bg-white/75'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                      index === currentImageIndex
                        ? 'border-primary'
                        : 'border-transparent hover:border-border'
                    )}
                  >
                    <Image
                      src={getSafeImageUrl(img)}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4">
            {/* Rating & Reviews */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {rating} ({reviewCount} opiniones)
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {product.description ||
                'Producto de alta calidad con excelente sabor y presentación premium.'}
            </p>

            <Separator />

            {/* Variant Selector */}
            {product.hasVariants && variants.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Selecciona variante:</Label>
                <RadioGroup value={selectedVariantId} onValueChange={setSelectedVariantId}>
                  {variants.map((variant) => {
                    const variantPrice = calculateItemDiscount(variant, 1, product);
                    return (
                      <div
                        key={variant._id}
                        className={cn(
                          'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all',
                          selectedVariantId === variant._id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50',
                          variant.stock === 0 && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => !variant.stock && setSelectedVariantId(variant._id)}
                      >
                        <RadioGroupItem
                          value={variant._id}
                          id={variant._id}
                          disabled={variant.stock === 0}
                        />
                        <Label
                          htmlFor={variant._id}
                          className="flex-1 cursor-pointer flex justify-between items-center"
                        >
                          <span className="font-medium">{variant.displayName}</span>
                          <span className="font-bold text-primary">
                            ${variantPrice.finalPrice.toLocaleString()}
                          </span>
                        </Label>
                        {variant.stock === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Agotado
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            <Separator />

            {/* Price */}
            {selectedVariant && (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    ${displayPrice.toLocaleString()}
                  </span>
                  {hasFixedDiscountApplied && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    ${unitPrice.toLocaleString()} por unidad
                  </p>
                )}
              </div>
            )}

            {/* Tiered Discounts */}
            {hasDiscount && discountTiers && discountTiers.length > 0 && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  💰 Descuentos por cantidad
                </h4>
                <div className="space-y-2">
                  {discountTiers.map((tier, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground">{tier.range}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{tier.price}</span>
                        <Badge variant="secondary" className="text-xs">
                          {tier.discount}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label className="text-sm">Cantidad:</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={!selectedVariant || quantity >= selectedVariant.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedVariant && (
                  <span className="text-sm text-muted-foreground">
                    Stock: {selectedVariant.stock} unidades
                  </span>
                )}
              </div>
            </div>

            {/* Subtotal */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal:</span>
                <span className="text-2xl font-bold text-primary">
                  ${displayPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
                className="w-full h-12 text-base"
                size="lg"
                variant={justAdded ? 'outline' : 'default'}
              >
                {justAdded ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Agregado al carrito
                  </>
                ) : isAdding ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Agregando...
                  </>
                ) : isOutOfStock ? (
                  'Agotado'
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Agregar al carrito - ${displayPrice.toLocaleString()}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                asChild
                onClick={() => onOpenChange(false)}
              >
                <Link href={`/productos/${product.slug}`}>
                  Ver página completa del producto →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
