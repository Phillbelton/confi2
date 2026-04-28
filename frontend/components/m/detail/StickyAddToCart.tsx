'use client';

import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyAddToCartProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onAdd: () => void;
  unitPrice: number;
  isAdding?: boolean;
  disabled?: boolean;
}

export function StickyAddToCart({
  quantity,
  onIncrement,
  onDecrement,
  onAdd,
  unitPrice,
  isAdding,
  disabled,
}: StickyAddToCartProps) {
  const total = unitPrice * quantity;

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur',
        'bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-0 lg:left-20'
      )}
    >
      <div className="mx-auto flex w-full max-w-screen-md items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3">
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={onDecrement}
            aria-label="Quitar uno"
            disabled={disabled || quantity <= 1}
            className="tappable grid h-10 w-10 place-items-center rounded-full bg-background text-foreground shadow-sm disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-base font-bold tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label="Agregar uno"
            disabled={disabled}
            className="tappable grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || isAdding}
          className={cn(
            'tappable inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-all',
            'hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60'
          )}
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Agregar</span>
          <span className="tabular-nums opacity-90">
            · ${Math.round(total).toLocaleString('es-CL')}
          </span>
        </button>
      </div>
    </div>
  );
}
