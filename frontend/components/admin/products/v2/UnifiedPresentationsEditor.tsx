'use client';

import { useState } from 'react';
import {
  Box, ChevronDown, Copy, Hash, PackageOpen, Plus, Trash2, TrendingDown,
  Star, ScanLine, BadgePercent, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { SaleUnitType, ProductTier, FixedDiscount } from '@/types';

/** Presentación en edición. `id` es una clave local (no se manda al backend). */
export interface PresentationDraft {
  id: string;
  type: SaleUnitType;
  quantity: number;
  unitPrice: number;
  barcode?: string;
  label?: string;
  fixedDiscount?: FixedDiscount;
  tiers: ProductTier[];
  principal: boolean;
}

const TYPE_LABELS: Record<SaleUnitType, string> = {
  unidad: 'Unidad',
  cantidadMinima: 'Cant. mínima',
  display: 'Display',
  embalaje: 'Embalaje',
};

const TYPE_ICON: Record<SaleUnitType, React.ComponentType<{ className?: string }>> = {
  unidad: Hash,
  cantidadMinima: Hash,
  display: PackageOpen,
  embalaje: Box,
};

const QTY_HINT: Record<SaleUnitType, string> = {
  unidad: 'Se vende suelta (1 unidad).',
  cantidadMinima: 'Mínimo de unidades por compra.',
  display: 'Caja sellada con N unidades.',
  embalaje: 'Embalaje mayorista con N unidades.',
};

const CLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

let _seq = 0;
export function newPresentation(partial?: Partial<PresentationDraft>): PresentationDraft {
  _seq += 1;
  return {
    id: `p-${Date.now()}-${_seq}`,
    type: 'unidad',
    quantity: 1,
    unitPrice: 0,
    tiers: [],
    principal: false,
    ...partial,
  };
}

/** Precio efectivo tras la oferta fija (espeja `discountedUnitPrice` del front). */
function discountedPrice(p: PresentationDraft): number {
  const fd = p.fixedDiscount;
  if (!fd?.enabled || !fd.value) return p.unitPrice;
  const next = fd.type === 'percentage' ? p.unitPrice * (1 - fd.value / 100) : p.unitPrice - fd.value;
  return Math.max(0, Math.round(next));
}

interface Props {
  value: PresentationDraft[];
  onChange: (v: PresentationDraft[]) => void;
  disabled?: boolean;
}

/**
 * Editor UNIFICADO de presentaciones (v2). Todas las formas de venta son la
 * misma tarjeta: una principal (alimenta los campos legacy del producto) y el
 * resto colapsables con un resumen de una línea — así cargar 5 formatos no es
 * un muro de campos. Cada una: tipo, factor, precio, EAN, etiqueta, oferta
 * (fixedDiscount) y tramos por volumen.
 */
export function UnifiedPresentationsEditor({ value, onChange, disabled }: Props) {
  // Tarjetas expandidas (por id). La principal arranca abierta.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(value.filter((p) => p.principal).map((p) => p.id))
  );

  const isOpen = (id: string) => expanded.has(id);
  const toggleOpen = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const open = (id: string) =>
    setExpanded((cur) => new Set(cur).add(id));

  const update = (i: number, patch: Partial<PresentationDraft>) =>
    onChange(value.map((p, n) => (n === i ? { ...p, ...patch } : p)));

  const setPrincipal = (i: number) => {
    onChange(value.map((p, n) => ({ ...p, principal: n === i })));
    open(value[i].id);
  };

  const remove = (i: number) => {
    const wasPrincipal = value[i].principal;
    const next = value.filter((_, n) => n !== i);
    if (wasPrincipal && next.length > 0 && !next.some((p) => p.principal)) {
      next[0] = { ...next[0], principal: true };
    }
    onChange(next);
  };

  const add = () => {
    const p = newPresentation({ type: 'display', quantity: 6 });
    onChange([...value, p]);
    open(p.id);
  };

  const duplicate = (i: number) => {
    const src = value[i];
    const copy = newPresentation({
      ...src,
      principal: false,
      label: src.label ? `${src.label} (copia)` : undefined,
      barcode: undefined,
      tiers: src.tiers.map((t) => ({ ...t })),
      fixedDiscount: src.fixedDiscount ? { ...src.fixedDiscount } : undefined,
    });
    const next = [...value];
    next.splice(i + 1, 0, copy);
    onChange(next);
    open(copy.id);
  };

  // ----- Tramos -----
  const addTier = (i: number) => {
    const p = value[i];
    const last = p.tiers[p.tiers.length - 1];
    const tier: ProductTier = last
      ? { minQuantity: last.minQuantity + 1, pricePerUnit: Math.max(1, Math.round(last.pricePerUnit * 0.95)), label: '' }
      : { minQuantity: 3, pricePerUnit: Math.max(1, Math.round(p.unitPrice * 0.92)), label: '' };
    update(i, { tiers: [...p.tiers, tier] });
  };
  const updateTier = (i: number, ti: number, patch: Partial<ProductTier>) =>
    update(i, { tiers: value[i].tiers.map((t, n) => (n === ti ? { ...t, ...patch } : t)) });
  const removeTier = (i: number, ti: number) =>
    update(i, { tiers: value[i].tiers.filter((_, n) => n !== ti) });

  // ----- Oferta -----
  const setPromo = (i: number, patch: Partial<FixedDiscount>) => {
    const cur = value[i].fixedDiscount ?? { enabled: false, type: 'percentage', value: 0 };
    update(i, { fixedDiscount: { ...cur, ...patch } });
  };

  return (
    <div className="space-y-3">
      {value.map((p, i) => {
        const Icon = TYPE_ICON[p.type];
        const fd = p.fixedDiscount;
        const promoOn = !!fd?.enabled;
        const finalPrice = discountedPrice(p);
        const hasPromo = promoOn && finalPrice < p.unitPrice;
        const isPackaged = p.type === 'display' || p.type === 'embalaje';
        const atomic = isPackaged && p.quantity > 0 ? Math.round(p.unitPrice / p.quantity) : null;
        const openCard = isOpen(p.id);

        return (
          <div
            key={p.id}
            className={cn(
              'overflow-hidden rounded-2xl border transition-all',
              p.principal
                ? 'border-primary/50 bg-gradient-to-b from-primary/[0.04] to-transparent shadow-sm ring-1 ring-primary/10'
                : 'border-border bg-card'
            )}
          >
            {/* ── Header (resumen, clicable para colapsar) ── */}
            <div
              className={cn(
                'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left',
                !openCard && 'hover:bg-muted/40'
              )}
            >
              <button
                type="button"
                onClick={() => toggleOpen(p.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5"
                aria-expanded={openCard}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-xl border',
                    p.principal ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {p.label || TYPE_LABELS[p.type]}
                    </span>
                    {p.principal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-px text-[10px] font-bold uppercase tracking-wide text-primary">
                        <Star className="h-2.5 w-2.5 fill-primary" />
                        Principal
                      </span>
                    )}
                    {hasPromo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-px text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                        <BadgePercent className="h-2.5 w-2.5" />
                        Oferta
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[11px] tabular-nums text-muted-foreground">
                    {p.quantity} u ·{' '}
                    {hasPromo ? (
                      <>
                        <span className="line-through">{CLP(p.unitPrice)}</span>{' '}
                        <span className="font-semibold text-foreground">{CLP(finalPrice)}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-foreground">{CLP(p.unitPrice)}</span>
                    )}
                    {atomic !== null && ` · ${CLP(atomic)}/u`}
                    {p.tiers.length > 0 && ` · ${p.tiers.length} tramo${p.tiers.length > 1 ? 's' : ''}`}
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-0.5">
                {!p.principal && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPrincipal(i)}
                    disabled={disabled}
                    className="h-8 gap-1 px-2 text-[11px] text-muted-foreground hover:text-primary"
                  >
                    <Star className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Hacer principal</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => duplicate(i)}
                  disabled={disabled}
                  className="h-8 w-8 p-0 text-muted-foreground"
                  title="Duplicar presentación"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(i)}
                  disabled={disabled || value.length <= 1}
                  className="h-8 w-8 p-0 text-destructive disabled:opacity-30"
                  title={value.length <= 1 ? 'Debe quedar al menos una presentación' : 'Eliminar'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={() => toggleOpen(p.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label={openCard ? 'Colapsar' : 'Expandir'}
                >
                  <ChevronDown className={cn('h-4 w-4 transition-transform', openCard && 'rotate-180')} />
                </button>
              </div>
            </div>

            {/* ── Cuerpo ── */}
            {openCard && (
              <div className="space-y-3.5 border-t border-border/60 px-3.5 pb-3.5 pt-3">
                {/* Tipo (segmented) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tipo</span>
                  <div className="flex overflow-hidden rounded-lg border bg-muted/30 p-0.5">
                    {(Object.keys(TYPE_LABELS) as SaleUnitType[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => update(i, { type: k, quantity: k === 'unidad' ? 1 : p.quantity || 6 })}
                        disabled={disabled}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                          p.type === k
                            ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {TYPE_LABELS[k]}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{QTY_HINT[p.type]}</span>
                </div>

                {/* Campos base */}
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                  <div>
                    <Label className="text-[11px]">Contiene</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        value={p.quantity}
                        disabled={disabled || p.type === 'unidad'}
                        onChange={(e) => update(i, { quantity: parseInt(e.target.value, 10) || 1 })}
                        className="h-9 pr-7 tabular-nums"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">u</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px]">Precio *</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        value={p.unitPrice}
                        disabled={disabled}
                        onChange={(e) => update(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="h-9 pl-6 font-semibold tabular-nums"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-1 text-[11px]">
                      <ScanLine className="h-3 w-3" />Cód. barras
                    </Label>
                    <Input
                      value={p.barcode || ''}
                      disabled={disabled}
                      onChange={(e) => update(i, { barcode: e.target.value })}
                      placeholder="EAN (opc.)"
                      inputMode="numeric"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-1 text-[11px]">
                      <Tag className="h-3 w-3" />Etiqueta
                    </Label>
                    <Input
                      value={p.label || ''}
                      disabled={disabled}
                      onChange={(e) => update(i, { label: e.target.value })}
                      placeholder="Caja, Pack…"
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Oferta (fixedDiscount) */}
                <div
                  className={cn(
                    'rounded-xl border transition-colors',
                    promoOn
                      ? 'border-orange-300/70 bg-orange-50/70 dark:border-orange-900/50 dark:bg-orange-950/20'
                      : 'border-dashed border-border'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <BadgePercent className={cn('h-4 w-4', promoOn ? 'text-orange-500' : 'text-muted-foreground')} />
                      Oferta puntual
                      {hasPromo && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {CLP(p.unitPrice)} → {CLP(finalPrice)}
                        </span>
                      )}
                    </span>
                    <Switch
                      checked={promoOn}
                      disabled={disabled}
                      onCheckedChange={(c) =>
                        setPromo(i, { enabled: c, type: fd?.type ?? 'percentage', value: fd?.value ?? 0 })
                      }
                    />
                  </div>

                  {promoOn && (
                    <div className="grid grid-cols-2 gap-2.5 border-t border-orange-200/60 px-3 pb-3 pt-2.5 dark:border-orange-900/40 md:grid-cols-5">
                      <div>
                        <Label className="text-[10px] uppercase">Tipo</Label>
                        <div className="flex overflow-hidden rounded-lg border bg-background">
                          <button
                            type="button"
                            onClick={() => setPromo(i, { type: 'percentage' })}
                            className={cn(
                              'flex-1 py-1.5 text-xs font-semibold transition-colors',
                              fd?.type !== 'amount' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setPromo(i, { type: 'amount' })}
                            className={cn(
                              'flex-1 py-1.5 text-xs font-semibold transition-colors',
                              fd?.type === 'amount' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            $
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase">Valor</Label>
                        <Input
                          type="number"
                          min={0}
                          value={fd?.value || 0}
                          onChange={(e) => setPromo(i, { value: parseFloat(e.target.value) || 0 })}
                          className="h-9 tabular-nums"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase">Desde</Label>
                        <Input
                          type="date"
                          value={(fd?.startDate || '').slice(0, 10)}
                          onChange={(e) => setPromo(i, { startDate: e.target.value || undefined })}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase">Hasta</Label>
                        <Input
                          type="date"
                          value={(fd?.endDate || '').slice(0, 10)}
                          onChange={(e) => setPromo(i, { endDate: e.target.value || undefined })}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase">Badge</Label>
                        <Input
                          value={fd?.badge || ''}
                          onChange={(e) => setPromo(i, { badge: e.target.value })}
                          placeholder="OFERTA"
                          maxLength={20}
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tramos por volumen */}
                <div className="rounded-xl border border-dashed">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <TrendingDown className="h-4 w-4 text-primary" />
                      Tramos por volumen
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addTier(i)}
                      disabled={disabled || p.unitPrice <= 0}
                      className="h-7 text-xs"
                    >
                      <Plus className="mr-1 h-3 w-3" />Tramo
                    </Button>
                  </div>

                  {p.tiers.length === 0 ? (
                    <p className="px-3 pb-2.5 text-[11px] text-muted-foreground">
                      Sin tramos: el cliente paga {CLP(p.unitPrice || 0)} sin importar la cantidad.
                    </p>
                  ) : (
                    <div className="border-t">
                      <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <span className="col-span-3">Desde (×{TYPE_LABELS[p.type].toLowerCase()})</span>
                        <span className="col-span-3">Precio c/u</span>
                        <span className="col-span-4">Etiqueta</span>
                        <span className="col-span-2 text-right">Dcto</span>
                      </div>
                      <div className="space-y-1.5 px-3 py-2">
                        {p.tiers.map((t, ti) => {
                          const dcto = p.unitPrice > 0 ? Math.round((1 - t.pricePerUnit / p.unitPrice) * 100) : 0;
                          return (
                            <div key={ti} className="grid grid-cols-12 items-center gap-2">
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  min={2}
                                  value={t.minQuantity}
                                  onChange={(e) => updateTier(i, ti, { minQuantity: parseInt(e.target.value, 10) || 2 })}
                                  className="h-8 tabular-nums"
                                />
                              </div>
                              <div className="col-span-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={t.pricePerUnit}
                                    onChange={(e) => updateTier(i, ti, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                                    className="h-8 pl-5 tabular-nums"
                                  />
                                </div>
                              </div>
                              <div className="col-span-4">
                                <Input
                                  value={t.label || ''}
                                  onChange={(e) => updateTier(i, ti, { label: e.target.value })}
                                  placeholder="Mayor, Distribuidor…"
                                  className="h-8"
                                />
                              </div>
                              <div className="col-span-2 flex items-center justify-end gap-1">
                                {dcto > 0 && (
                                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                                    −{dcto}%
                                  </span>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeTier(i, ti)}
                                  className="h-7 w-7 p-0 text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={add}
        disabled={disabled}
        className="h-11 w-full border-dashed text-muted-foreground hover:text-foreground"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Agregar presentación (display, caja, pallet…)
      </Button>
    </div>
  );
}

export default UnifiedPresentationsEditor;
