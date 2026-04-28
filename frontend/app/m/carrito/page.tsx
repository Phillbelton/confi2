'use client';

import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { CartItemM } from '@/components/m/cart/CartItemM';
import { CartCheckoutBar } from '@/components/m/cart/CartCheckoutBar';

export default function MCartPage() {
  const items = useCartStoreM((s) => s.items);
  const subtotal = useCartStoreM((s) => s.subtotal);
  const totalDiscount = useCartStoreM((s) => s.totalDiscount);
  const total = useCartStoreM((s) => s.total);
  const itemCount = useCartStoreM((s) => s.itemCount);
  const clearCart = useCartStoreM((s) => s.clearCart);

  if (itemCount === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag className="h-10 w-10" />
        </span>
        <h1 className="font-display text-xl font-bold">Tu carrito está vacío</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Agregá productos desde el catálogo para empezar tu pedido.
        </p>
        <Button asChild className="mt-2 rounded-full px-6">
          <Link href="/m/productos">Explorar productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <div>
          <h1 className="font-display text-xl font-bold leading-tight">Tu carrito</h1>
          <p className="text-xs text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="tappable inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Vaciar
        </button>
      </header>

      <div className="space-y-2 px-4 pt-2">
        {items.map((item) => (
          <CartItemM key={item.variantId} item={item} />
        ))}
      </div>

      <section className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-sm font-bold">Resumen</h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">
              ${Math.round(subtotal).toLocaleString('es-CL')}
            </dd>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-primary">
              <dt>Descuentos</dt>
              <dd className="tabular-nums">
                −${Math.round(totalDiscount).toLocaleString('es-CL')}
              </dd>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">
              ${Math.round(total).toLocaleString('es-CL')}
            </dd>
          </div>
        </dl>
      </section>

      <p className="px-4 pb-32 pt-3 text-center text-[11px] text-muted-foreground">
        Carrito del prototipo móvil. Independiente del carrito principal.
      </p>

      <CartCheckoutBar total={total} itemCount={itemCount} />
    </>
  );
}
