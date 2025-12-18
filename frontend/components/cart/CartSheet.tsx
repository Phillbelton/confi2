'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore } from '@/store/useCartStore';
import { getSafeImageUrl } from '@/lib/image-utils';
import type { CartItem } from '@/types';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { items, subtotal, totalDiscount, total, updateQuantity, removeItem } = useCartStore();
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item.variantId, newQuantity);
    }
  };

  const handleRemove = (variantId: string) => {
    removeItem(variantId);
  };

  const handleCheckoutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();
    setRipples((prev) => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== rippleId)), 600);

    // Mini confetti
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { x: 0.5, y: 0.8 },
      colors: ['#F97316', '#E11D48', '#FBBF24'],
      ticks: 150,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Carrito de Compras
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? 'Tu carrito está vacío'
              : `${items.length} producto${items.length !== 1 ? 's' : ''} en tu carrito`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center gap-4 px-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut' as const,
              }}
            >
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </motion.div>
            <motion.p
              className="text-muted-foreground text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              No hay productos en tu carrito
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => onOpenChange(false)} asChild>
                  <Link href="/productos">Ver productos</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6">
                <div className="space-y-4 pb-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => {
                  const product = item.productParent;
                  const variant = item.variant;
                  const rawImage =
                    variant.images?.[0] ||
                    (typeof product !== 'string' ? product.images?.[0] : null);
                  // ✅ OPTIMIZACIÓN: Thumbnail pequeño en carrito (100x100px)
                  const image = getSafeImageUrl(rawImage, { width: 100, height: 100, quality: 'auto' });

                  return (
                    <motion.div
                      key={item.variantId}
                      className="flex gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                      layout
                    >
                      {/* Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                        <Image
                          src={image}
                          alt={typeof product !== 'string' ? product.name : 'Producto'}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-1">
                          {typeof product !== 'string' && product.hasVariants
                            ? variant.name
                            : typeof product !== 'string'
                            ? product.name
                            : 'Producto'}
                        </h4>
                        {typeof product !== 'string' && product.hasVariants && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {variant.displayName}
                          </p>
                        )}

                        {/* Price */}
                        <div className="mt-1">
                          <span className="text-sm font-semibold">
                            ${(item.unitPrice - item.discount).toLocaleString()}
                          </span>
                          {item.discount > 0 && (
                            <span className="text-xs text-muted-foreground line-through ml-2">
                              ${item.unitPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                          <div className="w-8 text-center overflow-hidden">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={item.quantity}
                                className="text-sm font-medium inline-block"
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {item.quantity}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className="ml-auto"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRemove(item.variantId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                  })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Summary */}
            <motion.div
              className="px-6 py-4 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={subtotal}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    ${subtotal.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
              </div>
              {totalDiscount > 0 && (
                <motion.div
                  className="flex justify-between text-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <span className="text-muted-foreground">Descuentos</span>
                  <span className="text-success">-${totalDiscount.toLocaleString()}</span>
                </motion.div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={total}
                    className="text-primary inline-block"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                  >
                    ${total.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Footer */}
            <SheetFooter className="px-6 pb-6">
              <motion.div
                className="w-full relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button asChild className="w-full relative" size="lg">
                  <Link href="/checkout" onClick={(e) => {
                    handleCheckoutClick(e);
                    onOpenChange(false);
                  }}>
                    {ripples.map((ripple) => (
                      <motion.span
                        key={ripple.id}
                        className="absolute rounded-full bg-white/30 pointer-events-none"
                        style={{
                          left: ripple.x - 100,
                          top: ripple.y - 100,
                        }}
                        initial={{ width: 0, height: 0, opacity: 1 }}
                        animate={{ width: 200, height: 200, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    ))}
                    Proceder al Checkout
                  </Link>
                </Button>
              </motion.div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
