'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingCart, Check, Eye, Plus, Minus, Star } from 'lucide-react';
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
import { cardHover, fadeInUp } from '@/lib/motion-variants';

interface ProductCardEnhancedProps {
  product: ProductParent;
  variants?: ProductVariant[];
  className?: string;
  onQuickView?: () => void;
  index?: number; // Para lazy loading inteligente
}

export function ProductCardEnhanced({
  product,
  variants = [],
  className,
  onQuickView,
  index = 0,
}: ProductCardEnhancedProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?._id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const cardRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { triggerFly, particles, removeParticle } = useFlyToCart();

  // Update selectedVariantId when variants are loaded
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0]._id);
    }
  }, [variants, selectedVariantId]);

  // 3D Hover Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

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

  // Get selected variant or first variant
  const selectedVariant = variants.find((v) => v._id === selectedVariantId) || variants[0];

  // Check if product is new (created in last 7 days)
  const isNew =
    new Date().getTime() - new Date(product.createdAt).getTime() <
    7 * 24 * 60 * 60 * 1000;

  // Check if out of stock
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;

  // Get first image: use variant image if available, otherwise use parent image
  // ✅ OPTIMIZACIÓN: Cargar imagen optimizada de Cloudinary (400x400px)
  const mainImage = getSafeImageUrl(
    selectedVariant?.images?.[0] || product.images?.[0],
    { width: 400, height: 400, quality: 'auto' }
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

      // Trigger fly-to-cart animation
      if (addButtonRef.current) {
        const cartIcon = document.querySelector('[aria-label="Ver carrito"]');
        if (cartIcon) {
          triggerFly(addButtonRef.current, cartIcon as Element);
        }
      }

      // 🎉 Trigger confetti animation from button position
      if (addButtonRef.current) {
        const rect = addButtonRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 30,
          spread: 60,
          origin: { x, y },
          colors: ['#F97316', '#E11D48', '#FBBF24'], // primary, secondary, accent
          ticks: 200,
          gravity: 1.2,
          scalar: 0.8,
        });
      }

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
    <motion.div
      ref={cardRef}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
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
          'hover:shadow-2xl border-border/50',
          'transform-gpu', // GPU acceleration
          isOutOfStock && 'opacity-60'
        )}
      >
        {/* Gradient overlay on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Image Section */}
        <div className="aspect-square relative overflow-hidden bg-muted">
          <Link href={`/productos/${product.slug}`}>
            <motion.div
              className="relative w-full h-full"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
            >
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                loading={index < 8 ? 'eager' : 'lazy'}
                priority={index < 4}
              />
            </motion.div>
          </Link>

          {/* Quick View Button - Shows on hover */}
          {onQuickView && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg backdrop-blur-sm bg-background/90"
                onClick={onQuickView}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            </motion.div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Badge className="bg-gradient-sunset text-white shadow-md">
                  ⭐ Destacado
                </Badge>
              </motion.div>
            )}
            {isNew && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              >
                <Badge className="bg-green-500 text-white shadow-md">🆕 Nuevo</Badge>
              </motion.div>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="shadow-md">
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
                <Badge className="gradient-primary text-white pulse-badge shadow-md">
                  {discountBadge}
                </Badge>
              </motion.div>
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
                <motion.span
                  key={displayPrice}
                  initial={{ scale: 1.2, color: 'rgb(249, 115, 22)' }}
                  animate={{ scale: 1, color: 'rgb(249, 115, 22)' }}
                  className="text-xl font-bold"
                >
                  ${displayPrice.toLocaleString()}
                </motion.span>
                {hasFixedDiscountApplied && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground line-through"
                  >
                    ${originalPrice.toLocaleString()}
                  </motion.span>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: i * 0.05,
                  }}
                >
                  <Star
                    className={cn(
                      'h-3 w-3',
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </motion.div>
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
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex-shrink-0 flex flex-col items-center justify-center px-2 py-1 rounded-md border border-accent/30 bg-accent/5 min-w-[55px] cursor-default"
                  >
                    <span className="text-[9px] text-accent-foreground/60 font-medium leading-tight whitespace-nowrap">
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

          {/* Quantity Selector */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="w-8 text-center text-sm font-medium"
              >
                {quantity}
              </motion.span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={incrementQuantity}
                disabled={!selectedVariant || quantity >= selectedVariant.stock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Add to Cart Button */}
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                ref={addButtonRef}
                onClick={handleAddToCart}
                disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
                className={cn(
                  "w-full h-8 text-xs relative overflow-hidden",
                  justAdded && "gradient-primary"
                )}
                size="sm"
                variant={justAdded ? 'default' : 'default'}
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
            </motion.div>
          </div>

          {/* Stock info */}
          {selectedVariant && selectedVariant.isLowStock && !isOutOfStock && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-amber-600 font-medium"
            >
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
