'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingCart, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item.variantId, newQuantity);
    }
  };

  const handleRemove = (variantId: string) => {
    removeItem(variantId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white border-l border-gray-200">
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-gray-900">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Tu Carrito
              {items.length > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({items.length} {items.length === 1 ? 'producto' : 'productos'})
                </span>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 bg-gray-50">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-center font-medium">
              Tu carrito está vacío
            </p>
            <p className="text-gray-400 text-sm text-center">
              Agrega productos para comenzar tu compra
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              asChild
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Link href="/productos">
                Ver productos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => {
                      const product = item.productParent;
                      const variant = item.variant;
                      const rawImage =
                        variant.images?.[0] ||
                        (typeof product !== 'string' ? product.images?.[0] : null);
                      const image = getSafeImageUrl(rawImage, { width: 100, height: 100, quality: 'auto' });

                      return (
                        <motion.div
                          key={item.variantId}
                          className="flex gap-3 p-3 bg-white rounded-lg shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          layout
                        >
                          {/* Image */}
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
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
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {typeof product !== 'string' && product.hasVariants
                                  ? variant.name
                                  : typeof product !== 'string'
                                  ? product.name
                                  : 'Producto'}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500 -mt-1 -mr-1"
                                onClick={() => handleRemove(item.variantId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {typeof product !== 'string' && product.hasVariants && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {variant.displayName}
                              </p>
                            )}

                            {/* Price and Quantity */}
                            <div className="flex items-center justify-between mt-2">
                              {/* Price */}
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-primary">
                                  ${((item.unitPrice - item.discount) * item.quantity).toLocaleString('es-CL')}
                                </span>
                                {item.discount > 0 && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ${(item.unitPrice * item.quantity).toLocaleString('es-CL')}
                                  </span>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-white"
                                  onClick={() => handleQuantityChange(item, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium text-gray-900">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-white"
                                  onClick={() => handleQuantityChange(item, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>

            {/* Summary & Checkout */}
            <div className="border-t border-gray-200 bg-white">
              {/* Order Summary */}
              <div className="px-4 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${subtotal.toLocaleString('es-CL')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuentos</span>
                    <span className="text-green-600 font-medium">-${totalDiscount.toLocaleString('es-CL')}</span>
                  </div>
                )}
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-primary">
                    ${total.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="px-4 pb-4">
                <Button
                  asChild
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base"
                >
                  <Link href="/checkout" onClick={() => onOpenChange(false)}>
                    Ir al Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-gray-600 hover:text-gray-900"
                  onClick={() => onOpenChange(false)}
                >
                  Seguir comprando
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
