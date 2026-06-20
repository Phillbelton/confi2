'use client';

import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { SaleUnitType } from '@/types';

export interface ExtraTier {
  minQuantity: number;
  pricePerUnit: number;
  label?: string;
}

export interface ExtraPresentation {
  type: SaleUnitType;
  quantity: number;
  unitPrice: number;
  tiers: ExtraTier[];
  label?: string;
}

const TYPE_LABELS: Record<SaleUnitType, string> = {
  unidad: 'Unidad',
  cantidadMinima: 'Cantidad mínima',
  display: 'Display',
  embalaje: 'Embalaje',
};

interface Props {
  value: ExtraPresentation[];
  onChange: (v: ExtraPresentation[]) => void;
}

/**
 * Repetidor de presentaciones ADICIONALES (más allá de la principal). Cada una
 * con su tipo, factor (unidades), precio y tramos por mayor. La principal se
 * edita en el bloque "Venta y precios" de arriba.
 */
export function ExtraPresentationsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<ExtraPresentation>) =>
    onChange(value.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => onChange(value.filter((_, n) => n !== i));
  const add = () =>
    onChange([...value, { type: 'display', quantity: 6, unitPrice: 0, tiers: [], label: '' }]);

  const addTier = (i: number) => {
    const tiers = value[i].tiers;
    const last = tiers[tiers.length - 1];
    update(i, {
      tiers: [
        ...tiers,
        {
          minQuantity: last ? last.minQuantity * 2 : 2,
          pricePerUnit: last ? Math.round(last.pricePerUnit * 0.95) : value[i].unitPrice,
          label: '',
        },
      ],
    });
  };
  const updateTier = (i: number, ti: number, patch: Partial<ExtraTier>) =>
    update(i, { tiers: value[i].tiers.map((t, n) => (n === ti ? { ...t, ...patch } : t)) });
  const removeTier = (i: number, ti: number) =>
    update(i, { tiers: value[i].tiers.filter((_, n) => n !== ti) });

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Sin presentaciones adicionales. El producto se vende solo en la presentación principal.
        </p>
      )}

      {value.map((p, i) => (
        <div key={i} className="space-y-3 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Presentación {i + 2}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => remove(i)}
              className="h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select
                value={p.type}
                onValueChange={(v) =>
                  update(i, {
                    type: v as SaleUnitType,
                    quantity: v === 'unidad' ? 1 : p.quantity || 6,
                  })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as SaleUnitType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {TYPE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Unidades</Label>
              <Input
                type="number"
                min={1}
                value={p.quantity}
                disabled={p.type === 'unidad'}
                onChange={(e) => update(i, { quantity: parseInt(e.target.value, 10) || 1 })}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Precio</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  value={p.unitPrice}
                  onChange={(e) => update(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="h-9 pl-5 tabular-nums"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Etiqueta</Label>
              <Input
                value={p.label || ''}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Caja, Por mayor…"
                className="h-9"
              />
            </div>
          </div>

          {/* Tramos por mayor de ESTA presentación */}
          <div className="rounded-lg border border-dashed p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                <TrendingDown className="h-3 w-3 text-primary" />
                Tramos por mayor
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addTier(i)}
                disabled={p.unitPrice <= 0}
                className="h-7 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Tramo
              </Button>
            </div>
            {p.tiers.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Sin tramos. El cliente paga ${p.unitPrice || 0} sin importar la cantidad.
              </p>
            ) : (
              <div className="space-y-1.5">
                {p.tiers.map((t, ti) => (
                  <div key={ti} className="grid grid-cols-12 items-center gap-1.5">
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min={2}
                        value={t.minQuantity}
                        onChange={(e) => updateTier(i, ti, { minQuantity: parseInt(e.target.value, 10) || 2 })}
                        className="h-8"
                        placeholder="Desde"
                      />
                    </div>
                    <div className="col-span-6">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          value={t.pricePerUnit}
                          onChange={(e) => updateTier(i, ti, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                          className="h-8 pl-5 tabular-nums"
                          placeholder="Precio c/u"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTier(i, ti)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="mr-1 h-4 w-4" />
        Agregar presentación
      </Button>
    </div>
  );
}

export default ExtraPresentationsEditor;
