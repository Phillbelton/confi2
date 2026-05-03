'use client';

import { Eye, Package } from 'lucide-react';
import Image from 'next/image';
import { SaleUnitBadge } from '@/components/m/catalog/SaleUnitBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SaleUnit, ProductTier } from '@/types';

interface Props {
  name: string;
  unitPrice: number;
  saleUnit: SaleUnit;
  tiers: ProductTier[];
  imagePreview?: string;
  brandName?: string;
  formatLabel?: string;
  flavorName?: string;
  flavorColor?: string;
}

export function ProductLivePreview({
  name, unitPrice, saleUnit, tiers, imagePreview,
  brandName, formatLabel, flavorName, flavorColor,
}: Props) {
  const sortedTiers = [...(tiers || [])].sort((a, b) => a.minQuantity - b.minQuantity);
  const cheapest = sortedTiers.length > 0 ? sortedTiers[sortedTiers.length - 1].pricePerUnit : unitPrice;
  const discountPercent = unitPrice > 0 && cheapest < unitPrice
    ? Math.round((1 - cheapest / unitPrice) * 100)
    : 0;

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Vista previa del cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Card mini igual a la del catálogo */}
        <div className="mx-auto max-w-[220px]">
          <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-muted">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt={name || 'Producto'}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-5xl">🍭</div>
              )}
              {discountPercent > 0 && (
                <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                  {discountPercent}% dcto
                </span>
              )}
              <SaleUnitBadge saleUnit={saleUnit} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
                {name || 'Sin nombre'}
              </h3>
              {(brandName || formatLabel || flavorName) && (
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {[brandName, formatLabel, flavorName].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-auto pt-1">
                <div className="flex items-baseline gap-1.5">
                  {sortedTiers.length > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      desde
                    </span>
                  )}
                  <span className="text-base font-bold tabular-nums">
                    ${Math.round(cheapest).toLocaleString('es-CL')}
                  </span>
                  {cheapest < unitPrice && (
                    <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                      ${Math.round(unitPrice).toLocaleString('es-CL')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalle de tramos */}
        {sortedTiers.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tabla de precios
            </p>
            <div className="rounded-lg border bg-muted/30 p-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>1 a {sortedTiers[0].minQuantity - 1} u</span>
                <span className="tabular-nums font-mono">
                  ${Math.round(unitPrice).toLocaleString('es-CL')}/u
                </span>
              </div>
              {sortedTiers.map((t, i) => {
                const next = sortedTiers[i + 1];
                const range = next
                  ? `${t.minQuantity} a ${next.minQuantity - 1} u`
                  : `${t.minQuantity}+ u`;
                const dcto = unitPrice > 0
                  ? Math.round((1 - t.pricePerUnit / unitPrice) * 100)
                  : 0;
                return (
                  <div key={i} className="flex justify-between text-xs">
                    <span>
                      {range}
                      {t.label && <span className="ml-1 text-muted-foreground">({t.label})</span>}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {dcto > 0 && (
                        <span className="text-[10px] font-bold text-primary">
                          −{dcto}%
                        </span>
                      )}
                      <span className="tabular-nums font-mono font-semibold text-primary">
                        ${Math.round(t.pricePerUnit).toLocaleString('es-CL')}/u
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="text-xs text-muted-foreground rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-2">
          <p className="flex items-center gap-1.5">
            <Package className="h-3 w-3" />
            <span>
              El cliente compra de a <strong>{saleUnit.type === 'unidad' ? '1' : saleUnit.quantity}</strong> unidad{saleUnit.quantity !== 1 && 'es'}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
