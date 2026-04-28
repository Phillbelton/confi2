'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { getSafeImageUrl } from '@/lib/image-utils';
import type { CartItem } from '@/types';

interface CartItemMProps {
  item: CartItem;
}

export function CartItemM({ item }: CartItemMProps) {
  const updateQuantity = useCartStoreM((s) => s.updateQuantity);
  const removeItem = useCartStoreM((s) => s.removeItem);

  const image = getSafeImageUrl(
    item.variant.images?.[0] || item.productParent.images?.[0],
    { width: 160, height: 160, quality: 'auto' }
  );

  const variantLabel =
    item.variant.displayName ||
    Object.values(item.variant.attributes || {}).join(' · ') ||
    '';

  const lineTotal = item.unitPrice * item.quantity - item.discount * item.quantity;

  return (
    <article className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      <Link
        href={`/m/productos/${item.productParent.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        <Image
          src={image}
          alt={item.productParent.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/m/productos/${item.productParent.slug}`}
            className="line-clamp-2 text-sm font-semibold leading-tight"
          >
            {item.productParent.name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.variantId)}
            aria-label="Eliminar del carrito"
            className="tappable -mt-1 -mr-1 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {variantLabel && (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {variantLabel}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
            <button
              type="button"
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              aria-label="Quitar uno"
              className="tappable grid h-8 w-8 place-items-center rounded-full bg-background text-foreground shadow-sm"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              aria-label="Agregar uno"
              className="tappable grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-sm font-bold tabular-nums">
              ${Math.round(lineTotal).toLocaleString('es-CL')}
            </p>
            {item.discount > 0 && (
              <p className="text-[11px] tabular-nums text-muted-foreground line-through">
                ${Math.round(item.unitPrice * item.quantity).toLocaleString('es-CL')}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
