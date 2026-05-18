'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { CartItemM } from '@/components/m/cart/CartItemM';
import { CartCheckoutBar } from '@/components/m/cart/CartCheckoutBar';
import { cn } from '@/lib/utils';

export default function MCartPage() {
  const items = useCartStoreM((s) => s.items);
  const subtotal = useCartStoreM((s) => s.subtotal);
  const totalDiscount = useCartStoreM((s) => s.totalDiscount);
  const total = useCartStoreM((s) => s.total);
  const itemCount = useCartStoreM((s) => s.itemCount);
  const clearCart = useCartStoreM((s) => s.clearCart);

  if (itemCount === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center lg:py-32">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary lg:h-28 lg:w-28">
          <ShoppingBag className="h-10 w-10 lg:h-14 lg:w-14" />
        </span>
        <h1 className="font-display text-xl font-bold lg:text-3xl">
          Tu carrito está vacío
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground lg:max-w-md lg:text-base">
          Agregá productos desde el catálogo para empezar tu pedido.
        </p>
        <Button asChild className="mt-2 rounded-full px-6 lg:px-8 lg:text-base">
          <Link href="/m/productos">Explorar productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-4 lg:px-8 lg:pt-8 lg:pb-6">
        <div>
          <h1 className="font-display text-xl font-bold leading-tight lg:text-3xl">
            Tu carrito
          </h1>
          <p className="text-xs text-muted-foreground lg:text-sm">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="tappable inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 lg:text-sm"
        >
          <Trash2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          Vaciar
        </button>
      </header>

      {/* Layout 2 cols en lg+ */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:px-8 lg:pb-12">
        {/* Lista de items */}
        <div className="space-y-2 px-4 pt-2 lg:px-0 lg:pt-0">
          {items.map((item) => (
            <CartItemM key={item.productId} item={item} />
          ))}
        </div>

        {/* Sidebar resumen — en mobile va inline, en lg+ es sticky a la derecha */}
        <aside className="lg:sticky lg:top-[calc(var(--m-header-h,9.5rem))] lg:self-start">
          <section className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4 lg:mx-0 lg:mt-0 lg:p-6">
            <h2 className="font-display text-sm font-bold lg:text-lg">
              Resumen
            </h2>
            <dl className="mt-3 space-y-1.5 text-sm lg:space-y-2 lg:text-base">
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
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold lg:text-xl">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  ${Math.round(total).toLocaleString('es-CL')}
                </dd>
              </div>
            </dl>

            {/* CTA inline solo en lg+ — en mobile usa CartCheckoutBar sticky */}
            <Link
              href="/checkout"
              className={cn(
                'mt-5 hidden tappable items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-all',
                'hover:bg-primary/90 active:scale-[0.98] lg:flex lg:py-4 lg:text-base'
              )}
            >
              Ir a pagar
              <ArrowRight className="h-5 w-5" />
            </Link>
          </section>

          <p className="px-4 pb-32 pt-3 text-center text-[11px] text-muted-foreground lg:hidden">
            Carrito del prototipo móvil. Independiente del carrito principal.
          </p>
        </aside>
      </div>

      <CartCheckoutBar total={total} itemCount={itemCount} />
    </>
  );
}
