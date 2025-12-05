'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingCart, Check, Eye, Plus, Minus, Heart } from 'lucide-react';
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
  // Start with no variant selected (will show parent product data)
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

  // 3D Hover Effect - More subtle
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-5deg', '5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Get selected variant (null if none selected - shows parent data)
  const selectedVariant = selectedVariantId
    ? variants.find((v) => v._id === selectedVariantId)
    : null;

  // Check if product is new (created in last 7 days)
  const isNew =
    new Date().getTime() - new Date(product.createdAt).getTime() <
    7 * 24 * 60 * 60 * 1000;

  // Check if out of stock
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  // Get images
  const mainImage = getSafeImageUrl(
    selectedVariant?.images?.[0] || product.images?.[0],
    { width: 400, height: 400, quality: 'auto' }
  );

  const secondaryImage = getSafeImageUrl(
    selectedVariant?.images?.[1] || product.images?.[1],
    { width: 400, height: 400, quality: 'auto' }
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

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      addItem(product, selectedVariant, quantity);

      // Trigger fly-to-cart animation
      if (addButtonRef.current) {
        const cartIcon = document.querySelector('[aria-label="Ver carrito"]');
        if (cartIcon) {
          triggerFly(addButtonRef.current, cartIcon as Element);
        }
      }

      // Confetti animation
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
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('perspective-1000', className)}
    >
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-premium-lg border-border/50 bg-card',
          'transform-gpu backface-hidden',
          isOutOfStock && 'opacity-60'
        )}
      >
        {/* Gradient overlay on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(245, 184, 208, 0.08) 0%, transparent 70%)',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Image Section */}
        <div className="aspect-square relative overflow-hidden bg-muted/30">
          <Link href={`/productos/${product.slug}`}>
            <div className="relative w-full h-full">
              {/* Main Image */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
              >
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  loading={priority ? 'eager' : 'lazy'}
                  priority={priority}
                  onLoad={() => setImageLoaded(true)}
                />
              </motion.div>

              {/* Secondary Image (hover) */}
              {secondaryImage && secondaryImage !== mainImage && (
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                >
                  <Image
                    src={secondaryImage}
                    alt={`${product.name} - Vista alternativa`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    loading="lazy"
                  />
                </motion.div>
              )}

              {/* Loading Skeleton */}
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton" />
              )}
            </div>
          </Link>

          {/* Quick Actions - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            {/* Quick View */}
            {onQuickView && (
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full shadow-premium backdrop-blur-sm bg-card/90 hover:bg-card"
                  onClick={onQuickView}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Favorite */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  'h-10 w-10 rounded-full shadow-premium backdrop-blur-sm',
                  isFavorite ? 'bg-primary text-primary-foreground' : 'bg-card/90 hover:bg-card'
                )}
                onClick={toggleFavorite}
              >
                <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              </Button>
            </motion.div>
          </div>

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
            {product.featured && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={motionTransitions.spring}
              >
                <Badge className="gradient-sunset text-white shadow-premium backdrop-blur-sm">
                  ⭐ Destacado
                </Badge>
              </motion.div>
            )}
            {isNew && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...motionTransitions.spring, delay: 0.1 }}
              >
                <Badge className="bg-accent text-accent-foreground shadow-premium backdrop-blur-sm">
                  🆕 Nuevo
                </Badge>
              </motion.div>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="shadow-premium backdrop-blur-sm">
                Agotado
              </Badge>
            )}
            {hasDiscount && !isOutOfStock && discountBadge && (
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Badge className="gradient-primary text-white pulse-glow-soft shadow-premium backdrop-blur-sm">
                  {discountBadge}
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Product Name */}
          <Link href={`/productos/${product.slug}`}>
            <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors leading-snug">
              {selectedVariant ? selectedVariant.name : product.name}
            </h3>
          </Link>

          {/* Category Badge */}
          {product.categories && product.categories.length > 0 && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs font-normal">
                {typeof product.categories[0] === 'string'
                  ? product.categories[0]
                  : product.categories[0].name}
              </Badge>
            </div>
          )}

          {/* Variant Selector */}
          {product.hasVariants && variants.length > 0 && (
            <Select value={selectedVariantId || undefined} onValueChange={setSelectedVariantId}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue
                  placeholder={
                    product.variantAttributes?.[0]?.displayName ||
                    product.variantAttributes?.[0]?.name ||
                    'Seleccionar'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {variants.map((variant) => {
                  // Debug: Log variant data
                  if (!variant.displayName) {
                    console.log('Variant missing displayName:', variant);
                  }

                  return (
                    <SelectItem key={variant._id} value={variant._id}>
                      {variant.displayName || Object.values(variant.attributes || {}).join(' ') || 'Sin nombre'}
                      {variant.stock === 0 && ' (Agotado)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              {selectedVariant ? (
                <>
                  <motion.span
                    key={displayPrice}
                    initial={{ scale: 1.1, color: 'var(--primary)' }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-primary"
                  >
                    ${displayPrice.toLocaleString()}
                  </motion.span>
                  {hasFixedDiscountApplied && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground line-through"
                    >
                      ${originalPrice.toLocaleString()}
                    </motion.span>
                  )}
                </>
              ) : (
                // Show parent product price range when no variant selected
                <span className="text-2xl font-bold text-primary">
                  {variants.length > 0 ? (
                    (() => {
                      const prices = variants.map((v) => v.price);
                      const minPrice = Math.min(...prices);
                      const maxPrice = Math.max(...prices);
                      return minPrice === maxPrice
                        ? `$${minPrice.toLocaleString()}`
                        : `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
                    })()
                  ) : (
                    '$0'
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Tier Discount Badges */}
          {discountTiers && discountTiers.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {discountTiers.map((tier, i) => {
                const minQty = tier.range.split('-')[0].split('+')[0].trim();
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex-shrink-0 flex flex-col items-center justify-center px-2 py-1 rounded-md border border-accent/30 bg-accent/5 min-w-[55px]"
                  >
                    <span className="text-[9px] text-accent-foreground/60 font-medium leading-tight">
                      {minQty}+
                    </span>
                    <span className="text-[10px] text-accent-foreground font-bold leading-tight">
                      {tier.price}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-2 pt-1">
            {/* Quantity Selector */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-none hover:bg-primary/10"
                onClick={decrementQuantity}
                disabled={!selectedVariant || quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="w-10 text-center text-sm font-semibold"
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
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Add to Cart Button */}
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button
                ref={addButtonRef}
                onClick={handleAddToCart}
                disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
                className={cn(
                  "w-full h-9 text-xs relative overflow-hidden font-medium",
                  justAdded && "gradient-primary"
                )}
                size="sm"
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
                  'Seleccionar variante'
                ) : (
                  <>
                    <ShoppingCart className="mr-1.5 h-4 w-4" />
                    Agregar
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Stock info */}
          {selectedVariant && selectedVariant.isLowStock && !isOutOfStock && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-amber-600 font-medium flex items-center gap-1"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              ¡Solo quedan {selectedVariant.stock}!
            </motion.p>
          )}
        </CardContent>
      </Card>

      {/* Flying Cart Particles */}
      <FlyingCartParticles particles={particles} onParticleComplete={removeParticle} />
    </motion.div>
  );
}
