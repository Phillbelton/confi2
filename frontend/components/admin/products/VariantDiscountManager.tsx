'use client';

import { useState, useEffect } from 'react';
import { Percent, Plus, Trash2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormFieldWithHelp } from '@/components/ui/form-field-with-help';
import { InlineHelp } from '@/components/ui/inline-help';
import type { ProductVariant, FixedDiscount, TieredDiscountVariant, TieredDiscountTier } from '@/types';

interface VariantDiscountManagerProps {
  variant: ProductVariant;
  onSave: (data: { fixedDiscount?: FixedDiscount; tieredDiscount?: TieredDiscountVariant }) => void;
  isSaving?: boolean;
}

export function VariantDiscountManager({ variant, onSave, isSaving = false }: VariantDiscountManagerProps) {
  // Fixed Discount State
  const [fixedEnabled, setFixedEnabled] = useState(variant.fixedDiscount?.enabled || false);
  const [fixedType, setFixedType] = useState<'percentage' | 'amount'>(
    variant.fixedDiscount?.type || 'percentage'
  );
  const [fixedValue, setFixedValue] = useState(variant.fixedDiscount?.value?.toString() || '');
  const [fixedStartDate, setFixedStartDate] = useState(
    variant.fixedDiscount?.startDate ? new Date(variant.fixedDiscount.startDate).toISOString().split('T')[0] : ''
  );
  const [fixedEndDate, setFixedEndDate] = useState(
    variant.fixedDiscount?.endDate ? new Date(variant.fixedDiscount.endDate).toISOString().split('T')[0] : ''
  );
  const [fixedBadge, setFixedBadge] = useState(variant.fixedDiscount?.badge || '');

  // Tiered Discount State
  const [tieredActive, setTieredActive] = useState(variant.tieredDiscount?.active || false);
  const [tieredBadge, setTieredBadge] = useState(variant.tieredDiscount?.badge || '');
  const [tieredStartDate, setTieredStartDate] = useState(
    variant.tieredDiscount?.startDate ? new Date(variant.tieredDiscount.startDate).toISOString().split('T')[0] : ''
  );
  const [tieredEndDate, setTieredEndDate] = useState(
    variant.tieredDiscount?.endDate ? new Date(variant.tieredDiscount.endDate).toISOString().split('T')[0] : ''
  );
  const [tiers, setTiers] = useState<TieredDiscountTier[]>(
    variant.tieredDiscount?.tiers || []
  );

  // Calculate fixed discount preview
  const calculateFixedPreview = () => {
    if (!fixedEnabled || !fixedValue || parseFloat(fixedValue) === 0) {
      return null;
    }

    const value = parseFloat(fixedValue);
    let discountAmount = 0;

    if (fixedType === 'percentage') {
      discountAmount = (variant.price * value) / 100;
    } else {
      discountAmount = value;
    }

    const finalPrice = variant.price - discountAmount;
    const discountPercentage = (discountAmount / variant.price) * 100;

    return {
      originalPrice: variant.price,
      discountAmount,
      finalPrice,
      discountPercentage,
    };
  };

  // Calculate combined discount preview
  const calculateCombinedPreview = (quantity: number) => {
    let price = variant.price;
    let totalDiscount = 0;
    const details: string[] = [];

    // Apply fixed discount first
    const fixedPreview = calculateFixedPreview();
    if (fixedPreview) {
      price = fixedPreview.finalPrice;
      totalDiscount += fixedPreview.discountAmount;
      details.push(`fijo -${fixedPreview.discountPercentage.toFixed(0)}%`);
    }

    // Apply tiered discount
    if (tieredActive && tiers.length > 0) {
      const applicableTier = [...tiers]
        .sort((a, b) => a.minQuantity - b.minQuantity)
        .reverse()
        .find(
          (tier) =>
            quantity >= tier.minQuantity &&
            (tier.maxQuantity === null || quantity <= tier.maxQuantity)
        );

      if (applicableTier) {
        let tieredDiscount = 0;
        if (applicableTier.type === 'percentage') {
          tieredDiscount = (variant.price * applicableTier.value) / 100;
        } else {
          tieredDiscount = applicableTier.value;
        }
        price -= tieredDiscount;
        totalDiscount += tieredDiscount;
        details.push(`escal -${applicableTier.value}${applicableTier.type === 'percentage' ? '%' : 'Gs'}`);
      }
    }

    const totalPercentage = (totalDiscount / variant.price) * 100;

    return {
      originalPrice: variant.price,
      finalPrice: price,
      totalDiscount,
      totalPercentage,
      details: details.join(' + '),
    };
  };

  // Add tier
  const handleAddTier = () => {
    setTiers([
      ...tiers,
      {
        minQuantity: tiers.length > 0 ? (tiers[tiers.length - 1].maxQuantity || 0) + 1 : 2,
        maxQuantity: null,
        type: 'percentage',
        value: 0,
      },
    ]);
  };

  // Remove tier
  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  // Update tier
  const handleUpdateTier = (index: number, field: keyof TieredDiscountTier, value: any) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = {
      ...updatedTiers[index],
      [field]: value,
    };
    setTiers(updatedTiers);
  };

  // Handle save
  const handleSave = () => {
    const data: { fixedDiscount?: FixedDiscount; tieredDiscount?: TieredDiscountVariant } = {};

    // Fixed discount
    if (fixedEnabled && fixedValue && parseFloat(fixedValue) > 0) {
      data.fixedDiscount = {
        enabled: true,
        type: fixedType,
        value: parseFloat(fixedValue),
        startDate: fixedStartDate || undefined,
        endDate: fixedEndDate || undefined,
        badge: fixedBadge || undefined,
      };
    } else {
      data.fixedDiscount = {
        enabled: false,
        type: 'percentage',
        value: 0,
      };
    }

    // Tiered discount
    if (tieredActive && tiers.length > 0) {
      data.tieredDiscount = {
        tiers: tiers.map(tier => ({
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          type: tier.type,
          value: tier.value,
        })),
        startDate: tieredStartDate || undefined,
        endDate: tieredEndDate || undefined,
        badge: tieredBadge || undefined,
        active: true,
      };
    } else {
      data.tieredDiscount = {
        tiers: [],
        active: false,
      };
    }

    onSave(data);
  };

  const fixedPreview = calculateFixedPreview();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Descuentos: {variant.displayName || variant.sku}</h3>
        <p className="text-sm text-muted-foreground">
          SKU: {variant.sku} • Precio base: ${variant.price.toLocaleString()}
        </p>
      </div>

      {/* Fixed Discount Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <CardTitle>Descuento Fijo</CardTitle>
          </div>
          <CardDescription>
            Descuento único aplicable a esta variante (liquidación, promoción, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InlineHelp variant="info">
            <strong>Descuento Fijo:</strong> Reduce el precio base del producto. Ideal para liquidaciones, promociones especiales o productos en oferta.
          </InlineHelp>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="fixed-enabled" className="text-base">
              Activar descuento fijo
            </Label>
            <Switch
              id="fixed-enabled"
              checked={fixedEnabled}
              onCheckedChange={setFixedEnabled}
            />
          </div>

          {fixedEnabled && (
            <>
              <Separator />

              {/* Type Selection */}
              <FormFieldWithHelp
                label="Tipo de descuento"
                tooltip="Porcentaje: descuenta un % del precio (ej: 20%). Monto fijo: descuenta una cantidad exacta (ej: 5000 Gs)."
              >
                <RadioGroup value={fixedType} onValueChange={(v) => setFixedType(v as 'percentage' | 'amount')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="fixed-percentage" />
                    <Label htmlFor="fixed-percentage" className="font-normal">
                      Porcentaje (%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="amount" id="fixed-amount" />
                    <Label htmlFor="fixed-amount" className="font-normal">
                      Monto fijo (Gs)
                    </Label>
                  </div>
                </RadioGroup>
              </FormFieldWithHelp>

              {/* Value Input */}
              <FormFieldWithHelp
                label="Valor del descuento"
                htmlFor="fixed-value"
                tooltip={fixedType === 'percentage' ? 'Ingresa el porcentaje a descontar (0-100)' : 'Ingresa el monto exacto a descontar en Guaraníes'}
                required
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="fixed-value"
                    type="number"
                    min="0"
                    max={fixedType === 'percentage' ? '100' : undefined}
                    step={fixedType === 'percentage' ? '1' : '100'}
                    value={fixedValue}
                    onChange={(e) => setFixedValue(e.target.value)}
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground min-w-[60px]">
                    {fixedType === 'percentage' ? '%' : 'Gs.'}
                  </span>
                </div>
              </FormFieldWithHelp>

              {/* Preview */}
              {fixedPreview && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
                  <p className="text-sm font-medium">PREVIEW</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio original:</span>
                    <span>${fixedPreview.originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento:</span>
                    <span className="text-red-600">-${fixedPreview.discountAmount.toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Precio final:</span>
                    <span className="text-primary">
                      ${fixedPreview.finalPrice.toLocaleString()}{' '}
                      <span className="text-sm text-green-600">
                        ({fixedPreview.discountPercentage.toFixed(0)}% off)
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormFieldWithHelp
                  label="Vigencia desde"
                  htmlFor="fixed-start"
                  tooltip="Opcional. Fecha desde la cual el descuento estará activo. Deja vacío para que empiece inmediatamente."
                >
                  <Input
                    id="fixed-start"
                    type="date"
                    value={fixedStartDate}
                    onChange={(e) => setFixedStartDate(e.target.value)}
                  />
                </FormFieldWithHelp>
                <FormFieldWithHelp
                  label="Vigencia hasta"
                  htmlFor="fixed-end"
                  tooltip="Opcional. Fecha hasta la cual el descuento estará activo. Deja vacío para descuento permanente."
                >
                  <Input
                    id="fixed-end"
                    type="date"
                    value={fixedEndDate}
                    onChange={(e) => setFixedEndDate(e.target.value)}
                  />
                </FormFieldWithHelp>
              </div>

              {/* Badge */}
              <FormFieldWithHelp
                label="Etiqueta personalizada"
                htmlFor="fixed-badge"
                tooltip='Texto que verán los clientes en la tarjeta del producto. Ej: "¡OFERTA!", "LIQUIDACIÓN", "BLACK FRIDAY". Máximo 20 caracteres.'
              >
                <Input
                  id="fixed-badge"
                  type="text"
                  maxLength={20}
                  value={fixedBadge}
                  onChange={(e) => setFixedBadge(e.target.value)}
                  placeholder="ej: LIQUIDACIÓN, BLACK FRIDAY"
                />
              </FormFieldWithHelp>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tiered Discount Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <CardTitle>Descuentos Escalonados</CardTitle>
          </div>
          <CardDescription>
            Descuentos por cantidad comprada (mayorista)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InlineHelp variant="info">
            <strong>Descuentos Escalonados:</strong> Ofrece mejores precios a mayor cantidad comprada. Ej: 10-19 un: 5%, 20+ un: 10%.
            <strong className="block mt-1">¡IMPORTANTE:</strong> Se aplican DESPUÉS del descuento fijo (si existe).
          </InlineHelp>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="tiered-enabled" className="text-base">
              Activar descuentos escalonados
            </Label>
            <Switch
              id="tiered-enabled"
              checked={tieredActive}
              onCheckedChange={setTieredActive}
            />
          </div>

          {tieredActive && (
            <>
              <Separator />

              {/* Badge */}
              <FormFieldWithHelp
                label="Etiqueta personalizada"
                htmlFor="tiered-badge"
                tooltip='Texto visible para los clientes. Ej: "PACK AHORRO", "PRECIO MAYORISTA". Máximo 20 caracteres.'
              >
                <Input
                  id="tiered-badge"
                  type="text"
                  maxLength={20}
                  value={tieredBadge}
                  onChange={(e) => setTieredBadge(e.target.value)}
                  placeholder="ej: PACK AHORRO, MAYORISTA"
                />
              </FormFieldWithHelp>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormFieldWithHelp
                  label="Vigencia desde"
                  htmlFor="tiered-start"
                  tooltip="Opcional. Fecha de inicio del descuento. Deja vacío para que empiece inmediatamente."
                >
                  <Input
                    id="tiered-start"
                    type="date"
                    value={tieredStartDate}
                    onChange={(e) => setTieredStartDate(e.target.value)}
                  />
                </FormFieldWithHelp>
                <FormFieldWithHelp
                  label="Vigencia hasta"
                  htmlFor="tiered-end"
                  tooltip="Opcional. Fecha de fin del descuento. Deja vacío para descuento permanente."
                >
                  <Input
                    id="tiered-end"
                    type="date"
                    value={tieredEndDate}
                    onChange={(e) => setTieredEndDate(e.target.value)}
                  />
                </FormFieldWithHelp>
              </div>

              {/* Tiers Table */}
              <FormFieldWithHelp
                label="Niveles de descuento"
                tooltip="Define rangos de cantidad con descuentos crecientes. Ej: 10-19 unidades = 5%, 20+ unidades = 10%. Deja 'Max Cant' vacío para indicar 'infinito'."
              >
                {tiers.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Min Cant</TableHead>
                          <TableHead>Max Cant</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tiers.map((tier, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={tier.minQuantity}
                                onChange={(e) =>
                                  handleUpdateTier(index, 'minQuantity', parseInt(e.target.value) || 1)
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={tier.minQuantity}
                                value={tier.maxQuantity || ''}
                                onChange={(e) =>
                                  handleUpdateTier(
                                    index,
                                    'maxQuantity',
                                    e.target.value ? parseInt(e.target.value) : null
                                  )
                                }
                                placeholder="∞"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <select
                                value={tier.type}
                                onChange={(e) =>
                                  handleUpdateTier(index, 'type', e.target.value as 'percentage' | 'amount')
                                }
                                className="w-20 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                              >
                                <option value="percentage">%</option>
                                <option value="amount">Gs</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step={tier.type === 'percentage' ? '1' : '100'}
                                value={tier.value}
                                onChange={(e) =>
                                  handleUpdateTier(index, 'value', parseFloat(e.target.value) || 0)
                                }
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTier(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                    No hay niveles configurados
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTier}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar nivel
                </Button>
              </FormFieldWithHelp>

              {/* Combined Preview */}
              {(fixedPreview || tiers.length > 0) && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    <p className="text-sm font-medium">PREVIEW - Precios combinados</p>
                  </div>
                  {[1, 2, 6, 12].map((qty) => {
                    const preview = calculateCombinedPreview(qty);
                    if (preview.totalDiscount === 0 && qty > 1) return null;
                    return (
                      <div key={qty} className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">
                          {qty} unidad{qty > 1 ? 'es' : ''}:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            ${preview.finalPrice.toLocaleString()} c/u
                          </span>
                          {preview.totalDiscount > 0 && (
                            <span className="text-xs text-green-600">
                              (-{preview.totalPercentage.toFixed(0)}%: {preview.details})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <InlineHelp variant="warning">
        <strong>Orden de aplicación:</strong> Los descuentos se combinan en este orden:
        <ol className="list-decimal ml-4 mt-1 space-y-1">
          <li>Primero se aplica el <strong>descuento fijo</strong> al precio base</li>
          <li>Luego se aplica el <strong>descuento escalonado</strong> sobre el precio ya descontado</li>
        </ol>
        <p className="mt-2">Ejemplo: Precio $10.000, Fijo -20%, Escalonado 10un -10%<br/>
        → Paso 1: $10.000 - 20% = $8.000<br/>
        → Paso 2: $8.000 - 10% = $7.200 (precio final)</p>
      </InlineHelp>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Descuentos'}
        </Button>
      </div>
    </div>
  );
}
