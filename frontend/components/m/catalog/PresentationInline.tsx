'use client';

import { useState } from 'react';
import { Plus, Minus, ChevronDown } from 'lucide-react';
import { useCartStoreM, cartLineId } from '@/store/m/useCartStoreM';
import {
  effectiveUnitPrice,
  discountedUnitPrice,
  getDisplayTiers,
  getPrincipal,
  isPackagedSale,
  minQuantity,
  presTypeLabel,
  pricePerAtomicUnit,
  quantityStep,
} from '@/lib/discountCalculator';
import { cn } from '@/lib/utils';
import type { Product, Presentation } from '@/types';

/** Palabra para la unidad de venta en los textos de tramo (singular/plural). */
function unitWord(type: Presentation['type'], qty: number): string {
  if (type === 'display') return qty === 1 ? 'display' : 'displays';
  if (type === 'embalaje') return qty === 1 ? 'embalaje' : 'embalajes';
  return qty === 1 ? 'unidad' : 'unidades';
}

interface PresentationInlineProps {
  product: Product;
  /** C = true (escalera de tramos desplegable); B = false (una línea de tramo). */
  withLadder?: boolean;
}

/**
 * Selector de presentación INLINE en la card (opciones B y C). Al elegir un
 * chip, el precio + equivalente + tramo y el botón Agregar reaccionan a esa
 * presentación. Con `withLadder` (opción C) suma una escalera de tramos
 * desplegable. Reusa la matemática de precios vía el patrón `viewProduct`.
 */
export function PresentationInline({ product, withLadder = false }: PresentationInlineProps) {
  const addItem = useCartStoreM((s) => s.addItem);
  const updateQuantity = useCartStoreM((s) => s.updateQuantity);
  const items = useCartStoreM((s) => s.items);

  const presentations = product.presentaciones ?? [];
  const principalId = getPrincipal(product)?._id ?? '';
  const [selPresId, setSelPresId] = useState<string>(principalId);
  const [ladderOpen, setLadderOpen] = useState(false);

  // La presentación elegida se proyecta sobre `viewProduct` para reusar las
  // funciones de precio sin tocarlas (idéntico a la ficha y la vista rápida).
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
  // El carrito se keyea por la presentación elegida → el stepper refleja
  // cuántas de ESA presentación hay en el carrito.
  const lineId = cartLineId(product._id, selPres?._id ?? principalId);
  const inCart = items.find((i) => i.lineId === lineId)?.quantity || 0;

  const ppu = effectiveUnitPrice(viewProduct, minQ);
  const basePrice = discountedUnitPrice(viewProduct);
  const isPackaged = isPackagedSale(viewProduct);
  const ppuAtomic = pricePerAtomicUnit(viewProduct, ppu);
  const tiers = getDisplayTiers(viewProduct);
  const firstTier = tiers[0];
  const presType = viewProduct.saleUnit.type;

  return (
    <div className="mt-0.5">
      {/* Selector de presentación */}
      <div className="flex flex-wrap gap-1">
        {presentations.map((p) => {
          const active = (selPres?._id ?? '') === p._id;
          return (
            <button
              key={p._id}
              type="button"
              onClick={() => setSelPresId(p._id)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {presTypeLabel(p.type)}
            </button>
          );
        })}
      </div>

      {/* Precio de la presentación elegida */}
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[15px] font-bold tabular-nums text-foreground">
          ${Math.round(ppu).toLocaleString('es-CL')}
        </span>
        {isPackaged && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ${Math.round(ppuAtomic).toLocaleString('es-CL')}/u
          </span>
        )}
      </div>

      {/* B: una línea con el mejor tramo. C: escalera desplegable. */}
      {withLadder ? (
        <div className="mt-0.5 min-h-[1.1rem]">
          {firstTier && (
            <>
              <button
                type="button"
                onClick={() => setLadderOpen((o) => !o)}
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary"
              >
                ver tramos
                <ChevronDown
                  className={cn('h-3 w-3 transition-transform', ladderOpen && 'rotate-180')}
                />
              </button>
              {ladderOpen && (
                <ul className="mt-0.5 space-y-0.5">
                  <li className="flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      1–{firstTier.minQuantity - 1} {unitWord(presType, 2)}
                    </span>
                    <span className="tabular-nums">
                      ${Math.round(basePrice).toLocaleString('es-CL')} c/u
                    </span>
                  </li>
                  {tiers.map((t, i) => (
                    <li
                      key={i}
                      className="flex justify-between text-[10px] font-semibold text-primary"
                    >
                      <span>
                        {t.minQuantity}+ {unitWord(presType, t.minQuantity)}
                      </span>
                      <span className="tabular-nums">
                        ${Math.round(t.pricePerUnit).toLocaleString('es-CL')} c/u
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mt-0.5 min-h-[1.1rem]">
          {firstTier && (
            <p className="line-clamp-1 text-[10px] font-semibold text-primary">
              🎉 {firstTier.minQuantity}+ {unitWord(presType, firstTier.minQuantity)} a $
              {Math.round(firstTier.pricePerUnit).toLocaleString('es-CL')} c/u
            </p>
          )}
        </div>
      )}

      {/* Agregar / stepper de la presentación elegida */}
      {inCart === 0 ? (
        <button
          type="button"
          onClick={() => addItem(product, minQ, selPres?._id)}
          className="tappable mt-1.5 w-full rounded-full bg-primary py-1.5 text-[13px] font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 lg:!min-h-9"
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
            onClick={() => updateQuantity(lineId, inCart - step <= 0 ? 0 : inCart - step)}
            aria-label="Quitar"
            className="tappable grid h-8 w-8 place-items-center rounded-full bg-background text-primary shadow-sm hover:bg-muted"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold tabular-nums text-primary">{inCart}</span>
          <button
            type="button"
            onClick={() => updateQuantity(lineId, inCart + step)}
            aria-label="Agregar"
            className="tappable grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default PresentationInline;
