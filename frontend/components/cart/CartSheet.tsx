'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCartStore } from '@/store/useCartStore';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/types';

export function CartSheet() {
  const [open, setOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const { items, itemCount, subtotal, totalDiscount, total, updateQuantity, removeItem } =
    useCartStore();

  const handleRemoveItem = (variantId: string) => {
    removeItem(variantId);
    setItemToRemove(null);
  };

  const hasDiscounts = totalDiscount > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
              >
                {itemCount}
              </Badge>
            )}
            <span className="sr-only">Carrito de compras ({itemCount} items)</span>
          </Button>
        </SheetTrigger>

        <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
          <SheetHeader className="px-1">
            <SheetTitle>
              Carrito de compras
              {itemCount > 0 && ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
            </SheetTitle>
            <SheetDescription>
              {items.length === 0
                ? 'Tu carrito está vacío'
                : 'Revisa tus productos antes de proceder al checkout'}
            </SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            // Empty state
            <div className="flex flex-1 flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-muted p-6">
                <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Tu carrito está vacío</p>
                <p className="text-sm text-muted-foreground">
                  Agrega productos para comenzar tu pedido
                </p>
              </div>
              <Button asChild onClick={() => setOpen(false)}>
                <Link href="/productos">Ver productos</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="flex-1 pr-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.variantId}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={setItemToRemove}
                    />
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-3 px-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>

                {hasDiscounts && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success flex items-center gap-1">
                      <Badge variant="outline" className="text-success border-success">
                        Descuentos
                      </Badge>
                    </span>
                    <span className="font-medium text-success">
                      -${totalDiscount.toLocaleString()}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toLocaleString()}</span>
                </div>

                {hasDiscounts && (
                  <p className="text-xs text-muted-foreground">
                    ¡Ahorrás ${totalDiscount.toLocaleString()} con descuentos por cantidad!
                  </p>
                )}
              </div>

              {/* Actions */}
              <SheetFooter className="px-1 mt-4">
                <Button
                  asChild
                  className="w-full h-12"
                  size="lg"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/checkout">Proceder al checkout</Link>
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar este producto del carrito?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToRemove && handleRemoveItem(itemToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// CART ITEM ROW COMPONENT
// ============================================================================

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { productParent, variant, quantity, discount, subtotal } = item;

  const hasDiscount = discount > 0;
  const originalPrice = variant.price;
  const discountedPrice = originalPrice - discount;

  // Get main image
  const mainImage =
    variant.images?.[0] ||
    (typeof productParent !== 'string' && productParent.images?.[0]) ||
    '/placeholder-product.jpg';

  // Get product name
  const productName =
    typeof productParent !== 'string' ? productParent.name : 'Producto';

  // Get variant display name
  const variantName = variant.displayName || '';

  const handleIncrement = () => {
    onUpdateQuantity(variant._id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      onUpdateQuantity(variant._id, quantity - 1);
    }
  };

  return (
    <div className="flex gap-4">
      {/* Image */}
      <Link
        href={`/productos/${typeof productParent !== 'string' ? productParent.slug : '#'}`}
        className="relative h-20 w-20 overflow-hidden rounded-md border flex-shrink-0 bg-muted"
      >
        <Image
          src={mainImage}
          alt={productName}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-1">
          <Link
            href={`/productos/${typeof productParent !== 'string' ? productParent.slug : '#'}`}
            className="text-sm font-medium line-clamp-1 hover:underline"
          >
            {productName}
          </Link>
          {variantName && (
            <p className="text-xs text-muted-foreground">{variantName}</p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">
              ${discountedPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  ${originalPrice.toLocaleString()}
                </span>
                <Badge variant="outline" className="text-xs px-1 py-0 text-success border-success">
                  -{((discount / originalPrice) * 100).toFixed(0)}%
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleDecrement}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              ${subtotal.toLocaleString()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(variant._id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartSheet;
