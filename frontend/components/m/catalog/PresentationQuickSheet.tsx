'use client';

import { useState } from 'react';
import { Eye, Plus, Minus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import {
  effectiveUnitPrice,
  discountedUnitPrice,
  getDisplayTiers,
  getPrincipal,
  isPackagedSale,
  minQuantity,
  presLabel,
  presentationPriceSuffix,
  quantityStep,
} from '@/lib/discountCalculator';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface PresentationQuickSheetProps {
  product: Product;
  /** Clases extra para el botón disparador ("Ver presentaciones"). */
  className?: string;
}

/**
 * Vista rápida (opción D): un botón "Ver presentaciones" en la card abre un
 * bottom-sheet con el selector de presentación + equivalente por unidad +
 * tabla de tramos + cantidad, sin salir del catálogo. Reusa la misma
 * matemática de precios que la ficha vía el patrón `viewProduct`.
 */
export function PresentationQuickSheet({ product, className }: PresentationQuickSheetProps) {
  const addItem = useCartStoreM((s) => s.addItem);
  const [open, setOpen] = useState(false);

  const presentations = product.presentaciones ?? [];
  const principalId = getPrincipal(product)?._id ?? '';
  const [selPresId, setSelPresId] = useState<string>(principalId);
  const [quantity, setQuantity] = useState<number>(1);

  // La presentación elegida se proyecta sobre un `viewProduct` para reusar las
  // funciones de precio sin tocarlas (idéntico a la ficha).
  const selPres = presentations.find((p) => p._id === selPresId) ?? getPrincipal(product);
  const viewProduct: Product = selPres
    ? {
        ...product,
        saleUnit: { type: selPres.type, quantity: selPres.quantity },
        unitPrice: selPres.unitPrice,
        tiers: selPres.tiers,
        fixedDiscount: selPres.fixedDiscount,
      }
    : product;

  const minQ = minQuantity(viewProduct);
  const step = quantityStep(viewProduct);
  const realQty = Math.max(quantity, minQ);
  const ppu = effectiveUnitPrice(viewProduct, realQty);
  const total = ppu * realQty;
  const tiers = getDisplayTiers(viewProduct);
  const basePrice = discountedUnitPrice(viewProduct);
  const isPackaged = isPackagedSale(viewProduct);
  const compareAt = viewProduct.unitPrice;
  const ppuAtomic =
    isPackaged && viewProduct.saleUnit.quantity > 0
      ? ppu / viewProduct.saleUnit.quantity
      : ppu;

  // Cambiar de presentación reinicia la cantidad (realQty la lleva a su mínimo).
  const choosePres = (id: string) => {
    setSelPresId(id);
    setQuantity(1);
  };

  const handleAdd = () => {
    addItem(product, realQty, selPres?._id);
    setOpen(false);
  };

  const addLabel = selPres
    ? `Agregar${realQty > 1 ? ` ${realQty}` : ''} ${presLabel(selPres).toLowerCase()}`
    : 'Agregar al carrito';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            'tappable flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/5',
            className
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Ver presentaciones
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-6 pt-4"
      >
        <div className="mx-auto w-full max-w-xl">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" aria-hidden />
          <SheetTitle className="pr-8 text-base font-bold leading-tight">
            {product.name}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Elige presentación y cantidad, y agrega al carrito.
          </SheetDescription>

          {/* Selector de presentación */}
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
              Elige presentación
            </p>
            <div className="flex flex-wrap gap-2">
              {presentations.map((p) => {
                const active = (selPres?._id ?? '') === p._id;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => choosePres(p._id)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left transition-all',
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <span className="block text-sm font-semibold">{presLabel(p)}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
                      ${Math.round(p.unitPrice).toLocaleString('es-CL')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Precio de la presentación elegida */}
          <div className="mt-4 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              ${Math.round(ppu).toLocaleString('es-CL')}
            </span>
            <span className="text-xs text-muted-foreground">
              {presentationPriceSuffix(viewProduct)}
            </span>
            {ppu < compareAt && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                ${Math.round(compareAt).toLocaleString('es-CL')}
              </span>
            )}
          </div>
          {isPackaged && (
            <p className="mt-1 text-xs text-muted-foreground">
              Equivale a ${Math.round(ppuAtomic).toLocaleString('es-CL')} por unidad
            </p>
          )}

          {/* Tabla de tramos de la presentación elegida */}
          {tiers.length > 0 && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Mejor precio por mayor
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li className="flex justify-between">
                  <span>1 a {tiers[0].minQuantity - 1} unidades</span>
                  <span className="font-bold tabular-nums">
                    ${Math.round(basePrice).toLocaleString('es-CL')}/u
                  </span>
                </li>
                {tiers.map((t, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      Desde {t.minQuantity} u{t.label ? ` (${t.label})` : ''}
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      ${Math.round(t.pricePerUnit).toLocaleString('es-CL')}/u
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cantidad + total */}
          <div className="mt-4 flex items-center gap-3">
            <div className="inline-flex items-center rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(minQ, q - step))}
                disabled={realQty <= minQ}
                aria-label="Quitar"
                className="grid h-10 w-10 place-items-center rounded-full bg-background text-foreground shadow-sm hover:bg-muted disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 text-base font-bold tabular-nums">{realQty}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(minQ, q) + step)}
                aria-label="Agregar"
                className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold tabular-nums">
                ${Math.round(total).toLocaleString('es-CL')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="tappable mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Plus className="h-4 w-4" />
              {addLabel}
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PresentationQuickSheet;
