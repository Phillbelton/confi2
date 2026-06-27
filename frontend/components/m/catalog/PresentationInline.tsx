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

/**
 * Color del chip por presentación: escala FRÍA incremental dentro de la familia
 * turquesa→petróleo de la marca. La intensidad sube con el tamaño — Unidad
 * (turquesa claro) → Display (teal) → Embalaje (petróleo profundo). Inactivo ya
 * muestra la progresión (tinte sólido claro + texto del tono); activo destaca
 * con relleno sólido profundo + sombra. Sin saltos a colores cálidos.
 */
const PRES_CHIP: Record<string, { on: string; off: string }> = {
  unidad: {
    on: 'border-[var(--primary-500)] bg-[var(--primary-500)] text-white shadow-sm',
    off: 'border-[var(--primary-200)] bg-[var(--primary-100)] text-[var(--primary-700)] hover:bg-[var(--primary-200)]',
  },
  cantidadMinima: {
    on: 'border-[var(--primary-500)] bg-[var(--primary-500)] text-white shadow-sm',
    off: 'border-[var(--primary-200)] bg-[var(--primary-100)] text-[var(--primary-700)] hover:bg-[var(--primary-200)]',
  },
  display: {
    on: 'border-[var(--secondary-600)] bg-[var(--secondary-600)] text-white shadow-sm',
    off: 'border-[var(--secondary-300)] bg-[var(--secondary-200)] text-[var(--secondary-700)] hover:bg-[var(--secondary-300)]',
  },
  embalaje: {
    on: 'border-[var(--secondary-800)] bg-[var(--secondary-800)] text-white shadow-sm',
    off: 'border-[var(--secondary-400)] bg-[var(--secondary-300)] text-[var(--secondary-800)] hover:bg-[var(--secondary-400)]',
  },
};
const chipStyle = (type: string, active: boolean) =>
  (PRES_CHIP[type] ?? PRES_CHIP.unidad)[active ? 'on' : 'off'];

/** Tono de marca legible sobre blanco para los textos de descuento (tramos). */
const TIER_INK = 'text-[var(--primary-700)]';

interface PresentationInlineProps {
  product: Product;
  /** C = escalera de tramos desplegable; B = solo el mejor tramo en una línea. */
  withLadder?: boolean;
}

/**
 * Selector de presentación INLINE en la card (variantes B y C). Al elegir un
 * chip, el precio + equivalente por unidad + el tramo y el botón Agregar
 * reaccionan a esa presentación. Con `withLadder` (C) suma la escalera de tramos
 * desplegable; sin él (B) muestra solo el mejor tramo en una línea. Reusa la
 * matemática de precios vía el patrón `viewProduct`.
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

  // El precio reacciona a la cantidad real en carrito de ESA presentación: al
  // alcanzar un tramo por volumen, el precio mostrado baja al precio mayorista
  // (consistente con el cartel de tramo y con el bottom-sheet). Sin nada en
  // carrito, cae al mínimo → precio base de la presentación.
  const ppu = effectiveUnitPrice(viewProduct, Math.max(inCart, minQ));
  const basePrice = discountedUnitPrice(viewProduct);
  const isPackaged = isPackagedSale(viewProduct);
  const ppuAtomic = pricePerAtomicUnit(viewProduct, ppu);
  const tiers = getDisplayTiers(viewProduct);
  const firstTier = tiers[0];
  const presType = viewProduct.saleUnit.type;

  return (
    <div className="mt-0.5">
      {/* Selector de presentación: una sola fila CENTRADA con scroll horizontal —
          los chips se reparten parejo y se desbordan por ambos márgenes (izq. y
          der.) de borde a borde de la card, en vez de envolver. */}
      <div className="-mx-2 flex justify-center gap-1 overflow-x-auto px-2 scrollbar-hide">
        {presentations.map((p) => {
          const active = (selPres?._id ?? '') === p._id;
          return (
            <button
              key={p._id}
              type="button"
              onClick={() => setSelPresId(p._id)}
              aria-pressed={active}
              className={cn(
                'shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold whitespace-nowrap transition-colors',
                chipStyle(p.type, active)
              )}
            >
              {presTypeLabel(p.type)}
            </button>
          );
        })}
      </div>

      {/* Precio de la presentación elegida */}
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[15px] font-bold tabular-nums text-foreground">
          ${Math.round(ppu).toLocaleString('es-CL')}
        </span>
        {isPackaged && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            ${Math.round(ppuAtomic).toLocaleString('es-CL')}/u
          </span>
        )}
      </div>

      {/* C: escalera de tramos desplegable. B: solo el mejor tramo en una línea. */}
      {withLadder ? (
        <div className="mt-0.5 min-h-[1.15rem]">
          {firstTier && (
            <>
              <button
                type="button"
                onClick={() => setLadderOpen((o) => !o)}
                aria-expanded={ladderOpen}
                className={cn('inline-flex items-center gap-0.5 text-[11px] font-semibold', TIER_INK)}
              >
                ver tramos
                <ChevronDown
                  className={cn('h-3 w-3 transition-transform', ladderOpen && 'rotate-180')}
                />
              </button>
              {ladderOpen && (
                <ul className="mt-1 space-y-0.5">
                  <li className="flex justify-between text-[11px] text-muted-foreground">
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
                      className={cn('flex justify-between text-[11px] font-semibold', TIER_INK)}
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
        <div className="mt-0.5 min-h-[1.15rem]">
          {firstTier && (
            <p className={cn('line-clamp-1 text-[11px] font-semibold', TIER_INK)}>
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
