'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Heart, Plus, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFlyToCart } from '@/hooks/useFlyToCart';
import { FlyingCartParticles } from '@/components/cart/FlyingCartParticle';
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
import { motionVariants, motionTransitions } from '@/lib/design-system';

interface ProductCardPremiumProps {
  product: ProductParent;
  variants?: ProductVariant[];
  className?: string;
  onQuickView?: () => void;
  index?: number;
  priority?: boolean;
}

export function ProductCardPremium({
  product,
  variants = [],
  className,
  onQuickView,
  index = 0,
  priority = false,
}: ProductCardPremiumProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const cardRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { triggerFly, particles, removeParticle } = useFlyToCart();

  // Auto-select first variant on mount
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0]._id);
    }
  }, [variants, selectedVariantId]);

  // Get selected variant
  const selectedVariant = selectedVariantId
    ? variants.find((v) => v._id === selectedVariantId)
    : null;

  // Check if out of stock
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  // Get images
  const mainImage = getSafeImageUrl(
    selectedVariant?.images?.[0] || product.images?.[0],
    { width: 600, height: 600, quality: 'auto' }
  );

  // Discount calculations
  const hasDiscount = selectedVariant ? hasActiveDiscount(selectedVariant, product) : false;
  const discountBadge = selectedVariant ? getDiscountBadge(selectedVariant, product) : null;
  const discountTiers = selectedVariant ? getDiscountTiers(selectedVariant, product) : null;

  const priceInfo = selectedVariant
    ? calculateItemDiscount(selectedVariant, 1, product)
    : null;

  const displayPrice = priceInfo?.finalPrice || selectedVariant?.price || 0;
  const originalPrice = priceInfo?.originalPrice || selectedVariant?.price || 0;
  const hasFixedDiscountApplied = priceInfo?.appliedFixedDiscount !== null;

  // Get only first 2 discount tiers for display
  const visibleDiscountTiers = discountTiers ? discountTiers.slice(0, 2) : null;

  // Calculate price per unit (if variant has size/volume attribute)
  const getPricePerUnit = () => {
    if (!selectedVariant) return null;

    const sizeAttr = Object.entries(selectedVariant.attributes || {}).find(([key]) =>
      key.toLowerCase().includes('tamaño') ||
      key.toLowerCase().includes('size') ||
      key.toLowerCase().includes('volumen')
    );

    if (!sizeAttr) return null;

    const value = sizeAttr[1];
    const match = value.match(/(\d+(?:\.\d+)?)\s*(ml|l|lt|litro|litros|g|gr|kg)/i);

    if (!match) return null;

    let amount = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 'ml') amount = amount / 1000;
    if (unit === 'g' || unit === 'gr') amount = amount / 1000;

    const pricePerLiter = displayPrice / amount;
    const unitLabel = unit.includes('l') || unit.includes('litro') ? 'LT' : 'KG';

    return {
      price: Math.round(pricePerLiter),
      unit: unitLabel
    };
  };

  const pricePerUnit = getPricePerUnit();

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      addItem(product, selectedVariant, quantity);

      if (addButtonRef.current) {
        const cartIcon = document.querySelector('[aria-label="Ver carrito"]');
        if (cartIcon) {
          triggerFly(addButtonRef.current, cartIcon as Element);
        }
      }

      if (addButtonRef.current) {
        const rect = addButtonRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 25,
          spread: 50,
          origin: { x, y },
          colors: ['#F5B8D0', '#FAE1E8', '#F9D5E1'],
          ticks: 150,
          gravity: 1,
          scalar: 0.7,
        });
      }

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

  const incrementQuantity = () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos');
  };

  return (
    <motion.div
      ref={cardRef}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={motionVariants.fadeInUp}
      transition={motionTransitions.smooth}
      className={cn('perspective-1000', className)}
    >
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-2xl border-border/50 bg-card',
          'transform-gpu backface-hidden h-full flex flex-col',
          isOutOfStock && 'opacity-60'
        )}
      >
        {/* Image Section - Optimized aspect ratio */}
        <Link href={`/productos/${product.slug}`} className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/20 to-muted/40">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
          >
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              onLoad={() => setImageLoaded(true)}
            />
          </motion.div>

          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}

          {/* Favorite Heart - Top Right */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite();
            }}
            className={cn(
              'absolute top-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all',
              'backdrop-blur-sm shadow-lg',
              isFavorite
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/90 text-foreground hover:bg-card'
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </motion.button>

          {/* Discount Badge - Top Left */}
          {hasDiscount && !isOutOfStock && discountBadge && (
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-2 left-2 z-10"
            >
              <Badge className="bg-red-600 text-white text-sm font-bold px-2.5 py-1 shadow-lg">
                {discountBadge}
              </Badge>
            </motion.div>
          )}
        </Link>

        {/* Content Section - Compact spacing */}
        <CardContent className="flex-1 flex flex-col p-3 space-y-2">
          {/* Price Section - Blue color, with strikethrough */}
          <div className="space-y-0">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={displayPrice}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-blue-600"
              >
                ${displayPrice.toLocaleString()}
              </motion.span>
              {hasFixedDiscountApplied && (
                <span className="text-sm text-muted-foreground line-through">
                  ${originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Price per unit */}
            {pricePerUnit && (
              <p className="text-xs text-muted-foreground">
                ${pricePerUnit.price.toLocaleString()} por {pricePerUnit.unit}
              </p>
            )}
          </div>

          {/* Product Name - Compact */}
          <Link href={`/productos/${product.slug}`}>
            <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight min-h-[2.5rem]">
              {selectedVariant ? selectedVariant.name : product.name}
            </h3>
          </Link>

          {/* Variant Selector - If has variants */}
          {product.hasVariants && variants.length > 0 && (
            <Select value={selectedVariantId || undefined} onValueChange={setSelectedVariantId}>
              <SelectTrigger className="h-9 text-sm font-medium">
                <SelectValue
                  placeholder={
                    product.variantAttributes?.[0]?.displayName ||
                    product.variantAttributes?.[0]?.name ||
                    'Seleccionar'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {variants.map((variant) => (
                  <SelectItem key={variant._id} value={variant._id}>
                    {variant.displayName || Object.values(variant.attributes || {}).join(' ') || 'Sin nombre'}
                    {variant.stock === 0 && ' (Agotado)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Discount Tiers - Maximum 2 badges */}
          {visibleDiscountTiers && visibleDiscountTiers.length > 0 && (
            <div className="flex gap-1.5">
              {visibleDiscountTiers.map((tier, i) => {
                const minQty = tier.range.split('-')[0].split('+')[0].trim();
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-1 flex flex-col items-center justify-center px-2 py-1 rounded-md bg-accent/10 border border-accent/30"
                  >
                    <span className="text-[10px] text-foreground/70 font-medium leading-tight">
                      Desde {minQty} un
                    </span>
                    <span className="text-xs text-primary font-bold leading-tight">
                      {tier.price} c/u
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="flex-1" />

          {/* Quantity Selector + Add Button */}
          <div className="flex items-center gap-2">
            {/* Quantity Controls */}
            <div className="flex items-center border rounded-lg overflow-hidden bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-none hover:bg-primary/10"
                onClick={decrementQuantity}
                disabled={!selectedVariant || quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="w-8 text-center text-sm font-semibold"
              >
                {quantity}
              </motion.span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-none hover:bg-primary/10"
                onClick={incrementQuantity}
                disabled={!selectedVariant || quantity >= selectedVariant.stock}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Add to Cart Button */}
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button
                ref={addButtonRef}
                onClick={handleAddToCart}
                disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
                className={cn(
                  "w-full h-9 text-sm font-bold relative overflow-hidden",
                  "bg-red-600 hover:bg-red-700 text-white shadow-md",
                  justAdded && "bg-green-600 hover:bg-green-700"
                )}
              >
                {justAdded && (
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                {justAdded ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Agregado
                  </>
                ) : isAdding ? (
                  <>
                    <div className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ...
                  </>
                ) : isOutOfStock ? (
                  'Agotado'
                ) : !selectedVariant ? (
                  'Seleccionar'
                ) : (
                  <>
                    Agregar
                    <ShoppingCart className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Stock Warning - Compact */}
          {selectedVariant && selectedVariant.isLowStock && !isOutOfStock && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-amber-600 font-medium text-center flex items-center justify-center gap-1"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              ¡Solo quedan {selectedVariant.stock}!
            </motion.p>
          )}
        </CardContent>
      </Card>

      <FlyingCartParticles particles={particles} onParticleComplete={removeParticle} />
    </motion.div>
  );
}
