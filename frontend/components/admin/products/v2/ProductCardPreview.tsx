'use client';

import { useMemo } from 'react';
import { Plus, Package, ImageIcon } from 'lucide-react';
import { SaleUnitBadge } from '@/components/m/catalog/SaleUnitBadge';
import {
  effectiveUnitPrice,
  getDisplayTiers,
  getFixedDiscountBadge,
  hasActiveFixedDiscount,
  isPackagedSale,
  minQuantity,
  presentationPriceSuffix,
  pricePerAtomicUnit,
  presTypeLabel,
  priceFrom,
} from '@/lib/discountCalculator';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { PresentationDraft } from './UnifiedPresentationsEditor';

interface Props {
  name: string;
  presentations: PresentationDraft[];
  imagePreview?: string;
  brandName?: string;
  formatLabel?: string;
  flavorName?: string;
  className?: string;
}

/**
 * Réplica PRESENTACIONAL de la card del catálogo (`ProductCardM`): mismo markup
 * y mismas clases, pero sin carrito ni navegación. Se alimenta del estado del
 * formulario para que el admin vea EXACTAMENTE cómo se verá el producto.
 *
 * La matemática de precio sale de `discountCalculator` (misma fuente que la card
 * real) sintetizando un `Product` desde las presentaciones del form.
 */
export function ProductCardPreview({
  name, presentations, imagePreview, brandName, formatLabel, flavorName, className,
}: Props) {
  // Producto sintético: los helpers leen unitPrice/saleUnit/tiers/fixedDiscount
  // (de la principal, denormalizados) y presentaciones[].
  const product = useMemo<Product>(() => {
    const list = presentations.length > 0 ? presentations : [];
    const principal = list.find((p) => p.principal) ?? list[0];
    return {
      _id: 'preview',
      name: name || 'Sin nombre',
      slug: 'preview',
      description: '',
      unitPrice: principal?.unitPrice ?? 0,
      saleUnit: {
        type: principal?.type ?? 'unidad',
        quantity: principal?.quantity ?? 1,
      },
      tiers: principal?.tiers ?? [],
      fixedDiscount: principal?.fixedDiscount,
      presentaciones: list.map((p, i) => ({
        _id: p.id || `p${i}`,
        type: p.type,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        tiers: p.tiers ?? [],
        fixedDiscount: p.fixedDiscount,
        label: p.label,
        barcode: p.barcode,
        principal: !!p.principal,
      })),
      categories: [],
      images: imagePreview ? ['preview'] : [],
      featured: false,
      active: true,
      createdAt: '',
      updatedAt: '',
    } as unknown as Product;
  }, [name, presentations, imagePreview]);

  const multiPres = (product.presentaciones?.length ?? 0) > 1;
  const minQ = minQuantity(product);
  const ppu = effectiveUnitPrice(product, minQ);
  const shownPrice = multiPres ? priceFrom(product) : ppu;
  const compareAtPrice = product.unitPrice;
  const isPackaged = isPackagedSale(product);
  const showFromHint = multiPres || (product.tiers?.length || 0) > 0;
  const showFixedBadge = hasActiveFixedDiscount(product);
  const fixedBadgeText = showFixedBadge ? getFixedDiscountBadge(product) : '';
  const ppuAtomic = pricePerAtomicUnit(product, ppu);

  const presSignal = multiPres
    ? Array.from(new Set((product.presentaciones ?? []).map((p) => presTypeLabel(p.type)))).join(' · ')
    : '';

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

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        className
      )}
    >
      <div className="relative block aspect-square overflow-hidden bg-muted">
        {imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt={name || 'Producto'}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-40" />
          </div>
        )}

        {showFixedBadge && (
          <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
            {fixedBadgeText}
          </span>
        )}

        <SaleUnitBadge saleUnit={product.saleUnit} />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2">
        <h3 className="line-clamp-2 min-h-[2rem] text-[13px] font-semibold leading-tight text-foreground">
          {name || 'Sin nombre'}
        </h3>

        {(brandName || formatLabel || flavorName) && (
          <p className="line-clamp-1 text-[10px] text-muted-foreground">
            {[brandName, formatLabel, flavorName].filter(Boolean).join(' · ')}
          </p>
        )}

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
            {!multiPres && shownPrice < compareAtPrice && (
              <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                ${Math.round(compareAtPrice).toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {multiPres ? (
            <div className="mt-1 flex flex-col gap-1">
              {presSignal && (
                <p className="line-clamp-1 text-center text-[10px] text-muted-foreground">
                  {presSignal}
                </p>
              )}
              <span className="mt-0.5 inline-flex w-full items-center justify-center gap-1 rounded-full border border-primary/30 bg-primary/5 py-1 text-[11px] font-semibold text-primary">
                Ver presentaciones
              </span>
            </div>
          ) : (
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
          )}

          {!multiPres && (
            <div className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-1.5 text-[13px] font-bold text-primary-foreground">
              <Plus className="h-4 w-4" />
              Agregar
            </div>
          )}
        </div>
      </div>

      <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm">
        <Package className="h-3 w-3" /> Vista previa
      </span>
    </div>
  );
}

export default ProductCardPreview;
