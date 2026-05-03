'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStoreM, type CartItem } from '@/store/m/useCartStoreM';
import { quantityStep, minQuantity } from '@/lib/discountCalculator';
import { getSafeImageUrl } from '@/lib/image-utils';

interface Props {
  item: CartItem;
}

export function CartItemM({ item }: Props) {
  const updateQuantity = useCartStoreM((s) => s.updateQuantity);
  const removeItem = useCartStoreM((s) => s.removeItem);
  const step = quantityStep(item.product);
  const minQ = minQuantity(item.product);

  return (
    <div className="flex gap-3 rounded-2xl border bg-card p-3">
      <Link
        href={`/m/productos/${item.product.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        {item.product.images?.[0] ? (
          <Image
            src={getSafeImageUrl(item.product.images[0], { width: 160, height: 160 })}
            alt={item.product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-2xl">🍭</div>
        )}
      </Link>

      <div className="flex flex-1 min-w-0 flex-col">
        <Link href={`/m/productos/${item.product.slug}`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {item.product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground tabular-nums">
          ${Math.round(item.pricePerUnit).toLocaleString('es-CL')} c/u
          {item.discount > 0 && <span className="ml-1 text-primary">· dcto aplicado</span>}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, Math.max(minQ, item.quantity - step))}
              disabled={item.quantity <= minQ}
              aria-label="Quitar"
              className="grid h-7 w-7 place-items-center rounded-full bg-background text-foreground shadow-sm disabled:opacity-40"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 text-xs font-bold tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + step)}
              aria-label="Agregar"
              className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <p className="text-sm font-bold tabular-nums">
            ${Math.round(item.subtotal).toLocaleString('es-CL')}
          </p>

          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label="Eliminar"
            className="text-destructive hover:bg-destructive/10 grid h-8 w-8 place-items-center rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItemM;
