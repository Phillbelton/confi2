'use client';

import { useRef, useState } from 'react';
import { Package, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type AttributeType = 'formato' | 'unidades' | 'sabor' | 'presentacion' | 'personalizado';

export interface VariantAttribute {
  id: string;
  type: AttributeType;
  name: string;
  displayName: string;
  values: string[];
}

interface VariantAttributeBuilderProps {
  attributes: VariantAttribute[];
  onChange: (attributes: VariantAttribute[]) => void;
  disabled?: boolean;
}

const QUICK_STARTS = [
  { type: 'formato' as AttributeType, displayName: 'Formato', placeholder: 'ej: 250ml, 500ml, 1L, 2L' },
  { type: 'sabor' as AttributeType, displayName: 'Sabor', placeholder: 'ej: Chocolate, Vainilla, Fresa' },
  { type: 'presentacion' as AttributeType, displayName: 'Presentación', placeholder: 'ej: Caja, Bolsa, Individual' },
  { type: 'unidades' as AttributeType, displayName: 'Unidades', placeholder: 'ej: 6, 12, 24' },
];

function detectType(displayName: string): AttributeType {
  const n = displayName.toLowerCase().trim();
  if (n.includes('formato') || n.includes('tamaño') || n.includes('peso') || n.includes('volumen')) return 'formato';
  if (n.includes('sabor') || n.includes('variedad') || n.includes('gusto')) return 'sabor';
  if (n.includes('presentacion') || n.includes('presentación') || n.includes('empaque')) return 'presentacion';
  if (n.includes('unidad') || n.includes('cantidad') || n.includes('pack')) return 'unidades';
  return 'personalizado';
}

export function VariantAttributeBuilder({
  attributes,
  onChange,
  disabled = false,
}: VariantAttributeBuilderProps) {
  const [pendingName, setPendingName] = useState('');
  const [pendingValues, setPendingValues] = useState('');
  const [valuesPlaceholder, setValuesPlaceholder] = useState('ej: Opción A, Opción B, Opción C');
  const valuesRef = useRef<HTMLInputElement>(null);

  const parsedValues = pendingValues
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  const canAdd = pendingName.trim().length > 0 && parsedValues.length >= 2;

  const handleQuickStart = (preset: (typeof QUICK_STARTS)[0]) => {
    if (attributes.some((a) => a.type === preset.type)) return;
    setPendingName(preset.displayName);
    setValuesPlaceholder(preset.placeholder);
    setTimeout(() => valuesRef.current?.focus(), 0);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    const displayName = pendingName.trim();
    const type = detectType(displayName);
    const newAttr: VariantAttribute = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      name: displayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'),
      displayName,
      values: parsedValues,
    };
    onChange([...attributes, newAttr]);
    setPendingName('');
    setPendingValues('');
    setValuesPlaceholder('ej: Opción A, Opción B, Opción C');
  };

  const handleRemoveAttribute = (id: string) => {
    onChange(attributes.filter((a) => a.id !== id));
  };

  const handleRemoveValue = (attrId: string, value: string) => {
    onChange(
      attributes.map((a) =>
        a.id === attrId ? { ...a, values: a.values.filter((v) => v !== value) } : a
      )
    );
  };

  const existingTypes = new Set(attributes.map((a) => a.type));
  const totalVariants =
    attributes.length > 0
      ? attributes.reduce((acc, a) => acc * a.values.length, 1)
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Atributos de Variantes</CardTitle>
          {totalVariants > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalVariants} {totalVariants === 1 ? 'variante' : 'variantes'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Define las características que diferenciarán las variantes del producto
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick-start chips */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Accesos rápidos</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_STARTS.map((preset) => {
              const added = existingTypes.has(preset.type);
              return (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleQuickStart(preset)}
                  disabled={disabled || added}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    added
                      ? 'border-border text-muted-foreground opacity-40 cursor-default'
                      : 'border-border hover:border-primary hover:text-primary'
                  )}
                >
                  {!added && <Plus className="h-3 w-3" />}
                  {preset.displayName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row input */}
        <div className="flex gap-2 items-end">
          <div className="space-y-1 w-36 shrink-0">
            <Label className="text-xs">Atributo</Label>
            <Input
              placeholder="ej: Sabor"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && pendingName.trim()) {
                  e.preventDefault();
                  valuesRef.current?.focus();
                }
              }}
              disabled={disabled}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Valores separados por comas</Label>
            <Input
              ref={valuesRef}
              placeholder={valuesPlaceholder}
              value={pendingValues}
              onChange={(e) => setPendingValues(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              disabled={disabled}
              className="h-9 text-sm"
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={disabled || !canAdd}
            size="sm"
            className="h-9 shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>

        {pendingValues && parsedValues.length < 2 && (
          <p className="text-xs text-muted-foreground -mt-2 pl-1">
            Se necesitan al menos 2 valores separados por comas
          </p>
        )}

        {/* Defined attributes */}
        {attributes.length > 0 ? (
          <div className="space-y-2 pt-2 border-t">
            {attributes.map((attr) => {
              const hasWarning = attr.values.length < 2;
              return (
                <div
                  key={attr.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    hasWarning ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/30'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{attr.displayName}</span>
                      {hasWarning ? (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          Necesita 2+ valores
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {attr.values.length} valores
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {attr.values.map((value) => (
                        <span
                          key={value}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-background border"
                        >
                          {value}
                          {!disabled && (
                            <button
                              type="button"
                              onClick={() => handleRemoveValue(attr.id, value)}
                              className="hover:text-destructive ml-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAttribute(attr.id)}
                    disabled={disabled}
                    className="shrink-0 h-7 w-7"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground border-t">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">
              Usa los accesos rápidos o escribe el nombre del atributo arriba
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
