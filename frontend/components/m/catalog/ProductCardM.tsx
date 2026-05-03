'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { getSafeImageUrl } from '@/lib/image-utils';
import {
  effectiveUnitPrice,
  getBestDiscountPercent,
  hasAnyDiscount,
  minQuantity,
  quantityStep,
} from '@/lib/discountCalculator';
import { SaleUnitBadge } from './SaleUnitBadge';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardMProps {
  product: Product;
  className?: string;
  horizontal?: boolean;
}

export function ProductCardM({ product, className, horizontal }: ProductCardMProps) {
  const sp = useSearchParams();
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStoreM((s) => s.addItem);
  const updateQuantity = useCartStoreM((s) => s.updateQuantity);
  const items = useCartStoreM((s) => s.items);

  const inCart = items.find((i) => i.productId === product._id)?.quantity || 0;
  const image = getSafeImageUrl(product.images?.[0], { width: 320, height: 320, quality: 'auto' });
  const minQ = minQuantity(product);
  const step = quantityStep(product);

  // Precio mostrado: a la cantidad mínima del producto
  const ppu = effectiveUnitPrice(product, Math.max(minQ, 1));
  const showFromHint = (product.tiers?.length || 0) > 0;
  const discountPercent = getBestDiscountPercent(product);

  // Pasar el contexto del catálogo origen al detalle como ?from=
  // (preserva categoría / subcategoría / colección para los breadcrumbs).
  const productHref = (() => {
    const ctxKeys = ['categoria', 'subcategoria', 'coleccion'];
    const ctx = new URLSearchParams();
    ctxKeys.forEach((k) => {
      const v = sp?.get(k);
      if (v) ctx.set(k, v);
    });
    const ctxStr = ctx.toString();
    return ctxStr
      ? `/m/productos/${product.slug}?from=${encodeURIComponent(ctxStr)}`
      : `/m/productos/${product.slug}`;
  })();

  const handleAdd = () => {
    setIsAdding(true);
    addItem(product, minQ);
    setTimeout(() => setIsAdding(false), 250);
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
        horizontal && 'w-44 shrink-0 snap-start',
        className
      )}
    >
      <Link href={productHref} className="relative block aspect-square overflow-hidden bg-muted">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes={horizontal ? '176px' : '(max-width: 640px) 50vw, 25vw'}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {hasAnyDiscount(product) && discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
            {discountPercent}% dcto
          </span>
        )}

        {/* Badge SaleUnit en esquina inferior derecha */}
        <SaleUnitBadge saleUnit={product.saleUnit} />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={productHref} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1.5">
            {showFromHint && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                desde
              </span>
            )}
            <span className="text-base font-bold tabular-nums text-foreground">
              ${Math.round(ppu).toLocaleString('es-CL')}
            </span>
            {ppu < product.unitPrice && (
              <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                ${Math.round(product.unitPrice).toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {showFromHint && (
            <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-primary">
              🎉 Hasta {discountPercent}% por mayor
            </p>
          )}

          {inCart === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding}
              className="tappable mt-2 w-full rounded-full bg-primary py-2 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4" />
                Agregar
              </span>
            </button>
          ) : (
            <div className="mt-2 flex items-center justify-between rounded-full bg-primary/10 p-1">
              <button
                type="button"
                onClick={() => updateQuantity(product._id, Math.max(minQ - step, inCart - step) === 0 ? 0 : inCart - step)}
                aria-label="Quitar"
                className="tappable grid h-8 w-8 place-items-center rounded-full bg-background text-primary shadow-sm hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold tabular-nums text-primary">{inCart}</span>
              <button
                type="button"
                onClick={() => updateQuantity(product._id, inCart + step)}
                aria-label="Agregar"
                className="tappable grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCardM;
