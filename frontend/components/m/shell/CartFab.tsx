'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { cn } from '@/lib/utils';

export function CartFab() {
  const itemCount = useCartStoreM((s) => s.itemCount);
  const total = useCartStoreM((s) => s.total);

  if (itemCount === 0) return null;

  return (
    <Link
      href="/m/carrito"
      aria-label={`Ver carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}
      className={cn(
        'fixed right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground',
        'px-4 py-3 text-sm font-bold shadow-xl shadow-primary/30 transition-all',
        'hover:scale-105 active:scale-95',
        'bottom-[calc(72px+env(safe-area-inset-bottom))] lg:bottom-6'
      )}
    >
      <span className="relative">
        <ShoppingBag className="h-5 w-5" />
        <span className="absolute -right-2 -top-2 grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
          {itemCount}
        </span>
      </span>
      <span className="hidden sm:inline">Ver carrito</span>
      <span className="tabular-nums">
        ${Math.round(total).toLocaleString('es-CL')}
      </span>
    </Link>
  );
}
