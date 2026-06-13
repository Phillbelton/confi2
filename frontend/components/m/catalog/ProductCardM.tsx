'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { buildSrcSet, SIZESET } from '@/lib/imageSrcset';
import {
  effectiveUnitPrice,
  getDisplayTiers,
  getFixedDiscountBadge,
  hasActiveFixedDiscount,
  isPackagedSale,
  minQuantity,
  pricePerAtomicUnit,
  presentationPriceSuffix,
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
  const imgAttrs = buildSrcSet(product.images?.[0], SIZESET.card);
  const minQ = minQuantity(product);
  const step = quantityStep(product);

  // Precio mostrado: a la cantidad mínima del producto.
  // ppu = precio efectivo por PRESENTACIÓN (ya no por unidad atómica).
  const ppu = effectiveUnitPrice(product, Math.max(minQ, 1));
  const shownPrice = ppu;
  const compareAtPrice = product.unitPrice;
  const isPackaged = isPackagedSale(product);
  const showFromHint = (product.tiers?.length || 0) > 0;
  const showFixedBadge = hasActiveFixedDiscount(product);
  const fixedBadgeText = showFixedBadge ? getFixedDiscountBadge(product) : '';

  // "$X/u" informativo: precio por unidad atómica, derivado del ppu de la
  // presentación dividiendo por saleUnit.quantity. Solo cuando es paquete.
  const ppuAtomic = pricePerAtomicUnit(product, ppu);

  // Primer tier ordenado por minQuantity. minQuantity ya está en PRESENTACIONES.
  const firstTier = getDisplayTiers(product)[0];
  const tierShownPrice = firstTier?.pricePerUnit ?? 0;
  const tierShownQty = firstTier?.minQuantity ?? 0;
  const tierUnitLabel = (() => {
    if (!firstTier) return '';
    switch (product.saleUnit.type) {
      case 'display':
        return tierShownQty === 1 ? 'display' : 'displays';
      case 'embalaje':
        return tierShownQty === 1 ? 'caja' : 'cajas';
      default:
        return tierShownQty === 1 ? 'unidad' : 'unidades';
    }
  })();

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
      ? `/productos/${product.slug}?from=${encodeURIComponent(ctxStr)}`
      : `/productos/${product.slug}`;
  })();

  const handleAdd = () => {
    setIsAdding(true);
    addItem(product, minQ);
    setTimeout(() => setIsAdding(false), 250);
  };

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
        horizontal && 'w-40 shrink-0 snap-start',
        className
      )}
    >
      <Link href={productHref} className="relative block aspect-square overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgAttrs.src}
          srcSet={imgAttrs.srcSet}
          alt={product.name}
          sizes={horizontal ? '176px' : '(max-width: 640px) 50vw, 25vw'}
          loading="lazy"
          decoding="async"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
        />

        {showFixedBadge && (
          <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
            {fixedBadgeText}
          </span>
        )}

        {/* Badge SaleUnit en esquina inferior derecha */}
        <SaleUnitBadge saleUnit={product.saleUnit} />
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <Link href={productHref} className="block">
          {/* min-h reserva 2 líneas siempre → el nombre ocupa el mismo alto
              tenga 1 o 2 líneas, manteniendo el layout idéntico entre cards. */}
          <h3 className="line-clamp-2 min-h-[2rem] text-[13px] font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-0.5">
          <div className="flex items-baseline gap-1.5">
            {showFromHint && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                desde
              </span>
            )}
            <span className="text-[15px] font-bold tabular-nums text-foreground">
              ${Math.round(shownPrice).toLocaleString('es-CL')}
            </span>
            {shownPrice < compareAtPrice && (
              <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                ${Math.round(compareAtPrice).toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {/* Detalle opcional (precio/u de paquete + tier mayorista). Altura
              reservada fija (min-h) para que el precio y el botón "Agregar"
              queden alineados en TODAS las cards, tengan 0, 1 o 2 de estas
              líneas. Las líneas se anclan abajo (justify-end) para quedar
              pegadas al botón. */}
          <div className="mt-0.5 flex min-h-[1.85rem] flex-col justify-end gap-0.5">
            {isPackaged && (
              <p className="line-clamp-1 text-[10px] text-muted-foreground">
                {presentationPriceSuffix(product)} · ${Math.round(ppuAtomic).toLocaleString('es-CL')}/u
              </p>
            )}

            {showFromHint && firstTier && (
              <p className="line-clamp-1 text-[10px] font-semibold text-primary">
                🎉 {tierShownQty}+ {tierUnitLabel} a ${Math.round(tierShownPrice).toLocaleString('es-CL')} c/u
              </p>
            )}
          </div>

          {inCart === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding}
              className="tappable mt-1.5 w-full rounded-full bg-primary py-1.5 text-[13px] font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60 lg:!min-h-9"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4" />
                Agregar
              </span>
            </button>
          ) : (
            <div className="mt-1.5 flex items-center justify-between rounded-full bg-primary/10 p-1">
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
