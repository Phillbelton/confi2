'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStoreM } from '@/store/m/useCartStoreM';

interface CartToastMContentProps {
  toastId: string | number;
  productName: string;
  variantName?: string;
  image: string;
  quantity: number;
}

function CartToastMContent({
  toastId,
  productName,
  variantName,
  image,
  quantity,
}: CartToastMContentProps) {
  const itemCount = useCartStoreM((s) => s.itemCount);
  const total = useCartStoreM((s) => s.total);

  return (
    <div className="relative flex w-[340px] max-w-[calc(100vw-2rem)] gap-3 rounded-2xl border border-border bg-card p-3 pr-8 shadow-xl border-l-4 border-l-primary">
      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        aria-label="Cerrar"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="relative flex-shrink-0">
        <div className="h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted">
          <Image
            src={image}
            alt={productName}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-card">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-tight">
            ¡Agregado al carrito!
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-muted-foreground">
            {quantity} × {productName}
            {variantName ? ` · ${variantName}` : ''}
          </p>
          <p className="mt-0.5 text-sm font-bold text-primary tabular-nums">
            ${Math.round(total).toLocaleString('es-CL')}
          </p>
        </div>

        <Link
          href="/m/carrito"
          onClick={() => toast.dismiss(toastId)}
          className="mt-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Ver carrito
          {itemCount > 0 && (
            <span className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

export function showCartToast({
  productName,
  variantName,
  image,
  quantity = 1,
}: {
  productName: string;
  variantName?: string;
  image: string;
  quantity?: number;
}) {
  toast.custom(
    (t) => (
      <CartToastMContent
        toastId={t}
        productName={productName}
        variantName={variantName}
        image={image}
        quantity={quantity}
      />
    ),
    { duration: 3500, unstyled: true }
  );
}
