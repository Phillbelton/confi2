'use client';

import { cn } from '@/lib/utils';
import type { SaleUnit, SaleUnitType } from '@/types';

interface Props {
  saleUnit: SaleUnit;
  className?: string;
}

const STYLE: Record<SaleUnitType, string> = {
  unidad: 'bg-blue-600 text-white',
  cantidadMinima: 'bg-blue-600 text-white',
  display: 'bg-red-600 text-white',
  embalaje: 'bg-amber-600 text-white',
};

export function badgeText(type: SaleUnitType, qty: number): string {
  switch (type) {
    case 'unidad': return '1 Unid.';
    case 'cantidadMinima': return `Cant. min ${qty} Unid.`;
    case 'display': return `Display ${qty} Unid.`;
    case 'embalaje': return `Embalaje ${qty} Unid.`;
  }
}

/**
 * Badge inspirado en Jumbo — esquina inferior derecha de la imagen del producto.
 * Forma trapezoidal con número grande y texto pequeño debajo.
 */
export function SaleUnitBadge({ saleUnit, className }: Props) {
  const text = badgeText(saleUnit.type, saleUnit.quantity);
  // Splitear: número | resto
  const match = text.match(/(\d+)\s*(.+)/);
  const num = match?.[1] || `${saleUnit.quantity}`;
  const rest = match?.[2] || text;
  // Para "Cant. min N Unid." anteponer "Cant. min" arriba si aplica
  let topLabel = '';
  let mainNum = num;
  let bottomLabel = rest;
  if (saleUnit.type === 'cantidadMinima') {
    topLabel = 'Cant. min';
    mainNum = String(saleUnit.quantity);
    bottomLabel = 'Unid.';
  } else if (saleUnit.type === 'display') {
    topLabel = 'Display';
    mainNum = String(saleUnit.quantity);
    bottomLabel = 'Unid.';
  } else if (saleUnit.type === 'embalaje') {
    topLabel = 'Embalaje';
    mainNum = String(saleUnit.quantity);
    bottomLabel = 'Unid.';
  } else {
    topLabel = '';
    mainNum = '1';
    bottomLabel = 'Unid.';
  }

  return (
    <div
      className={cn(
        'absolute right-0 bottom-2 grid place-items-center rounded-l-lg px-2.5 py-1 shadow-md',
        STYLE[saleUnit.type],
        className
      )}
      aria-label={text}
    >
      {topLabel && (
        <span className="text-[8px] font-bold uppercase tracking-wide leading-none">
          {topLabel}
        </span>
      )}
      <span className="font-bold leading-tight text-base">{mainNum}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide leading-none">
        {bottomLabel}
      </span>
    </div>
  );
}

export default SaleUnitBadge;
