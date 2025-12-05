'use client';

import { useState } from 'react';
import { Plus, Trash2, Info, Package, Hash, Palette, Box, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Tipos de atributos predefinidos
export type AttributeType = 'formato' | 'unidades' | 'sabor' | 'presentacion' | 'personalizado';

// Unidades permitidas para formato
export type FormatUnit = 'ml' | 'L' | 'g' | 'kg';

// Valores predefinidos para sabores comunes
const PRESET_FLAVORS = [
  'Chocolate',
  'Vainilla',
  'Fresa',
  'Limón',
  'Naranja',
  'Menta',
  'Caramelo',
  'Café',
  'Coco',
  'Dulce de Leche',
  'Frambuesa',
  'Mora',
  'Maracuyá',
  'Piña',
  'Original',
  'Sin Azúcar',
];

// Valores predefinidos para presentaciones
const PRESET_PRESENTATIONS = [
  'Caja',
  'Bolsa',
  'Individual',
  'Pack',
  'Display',
  'Estuche',
  'Frasco',
  'Lata',
  'Botella',
  'Sobre',
];

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

export function VariantAttributeBuilder({
  attributes,
  onChange,
  disabled = false,
}: VariantAttributeBuilderProps) {
  const [selectedType, setSelectedType] = useState<AttributeType>('formato');
  const [customName, setCustomName] = useState('');

  // Estados para Formato
  const [formatNumber, setFormatNumber] = useState('');
  const [formatUnit, setFormatUnit] = useState<FormatUnit>('ml');
  const [formatValues, setFormatValues] = useState<string[]>([]);

  // Estados para Unidades
  const [unitNumber, setUnitNumber] = useState('');
  const [unitValues, setUnitValues] = useState<string[]>([]);

  // Estados para Sabor
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [customFlavor, setCustomFlavor] = useState('');
  const [flavorValues, setFlavorValues] = useState<string[]>([]);

  // Estados para Presentación
  const [selectedPresentation, setSelectedPresentation] = useState('');
  const [presentationValues, setPresentationValues] = useState<string[]>([]);

  // Estados para Personalizado
  const [customValues, setCustomValues] = useState('');

  const attributeTypeConfig = {
    formato: {
      icon: Package,
      label: 'Formato',
      description: 'Medidas de volumen o peso del producto',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      tooltip: 'Ideal para productos con diferentes tamaños o pesos. Ejemplo: bebidas (250ml, 500ml, 1L), alimentos (100g, 500g, 1kg)',
    },
    unidades: {
      icon: Hash,
      label: 'Unidades',
      description: 'Cantidad de piezas o elementos',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      tooltip: 'Para productos que se venden por cantidad. Ejemplo: paquetes de 6, 12, 24 unidades',
    },
    sabor: {
      icon: Palette,
      label: 'Sabor',
      description: 'Sabores o variedades del producto',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      tooltip: 'Para productos con diferentes sabores o variedades. Puedes elegir sabores comunes o agregar personalizados',
    },
    presentacion: {
      icon: Box,
      label: 'Presentación',
      description: 'Tipo de empaque o presentación',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      tooltip: 'Para productos con diferentes tipos de empaque. Ejemplo: caja, bolsa, individual, pack',
    },
    personalizado: {
      icon: Type,
      label: 'Personalizado',
      description: 'Define tu propio atributo',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      tooltip: 'Usa esta opción solo si ninguno de los tipos predefinidos se ajusta a tus necesidades. Mantén la consistencia en los nombres',
    },
  };

  // Agregar valor a formato
  const handleAddFormatValue = () => {
    const number = parseFloat(formatNumber);
    if (!number || number <= 0) return;

    const value = `${number} ${formatUnit}`;
    if (!formatValues.includes(value)) {
      setFormatValues([...formatValues, value]);
      setFormatNumber('');
    }
  };

  // Agregar valor a unidades
  const handleAddUnitValue = () => {
    const number = parseInt(unitNumber);
    if (!number || number <= 0) return;

    const value = `${number}`;
    if (!unitValues.includes(value)) {
      setUnitValues([...unitValues, value]);
      setUnitNumber('');
    }
  };

  // Agregar sabor
  const handleAddFlavor = () => {
    const flavor = selectedFlavor || customFlavor;
    if (!flavor.trim()) return;

    if (!flavorValues.includes(flavor)) {
      setFlavorValues([...flavorValues, flavor]);
      setSelectedFlavor('');
      setCustomFlavor('');
    }
  };

  // Agregar presentación
  const handleAddPresentation = () => {
    if (!selectedPresentation) return;

    if (!presentationValues.includes(selectedPresentation)) {
      setPresentationValues([...presentationValues, selectedPresentation]);
      setSelectedPresentation('');
    }
  };

  // Crear atributo final
  const handleCreateAttribute = () => {
    let values: string[] = [];
    let name = '';
    let displayName = '';

    switch (selectedType) {
      case 'formato':
        if (formatValues.length === 0) return;
        values = formatValues;
        name = 'formato';
        displayName = 'Formato';
        break;

      case 'unidades':
        if (unitValues.length === 0) return;
        values = unitValues;
        name = 'unidades';
        displayName = 'Unidades';
        break;

      case 'sabor':
        if (flavorValues.length === 0) return;
        values = flavorValues;
        name = 'sabor';
        displayName = 'Sabor';
        break;

      case 'presentacion':
        if (presentationValues.length === 0) return;
        values = presentationValues;
        name = 'presentacion';
        displayName = 'Presentación';
        break;

      case 'personalizado':
        if (!customName.trim() || !customValues.trim()) return;
        values = customValues.split(',').map(v => v.trim()).filter(v => v);
        name = customName.toLowerCase().trim();
        displayName = customName.trim();
        break;
    }

    const newAttribute: VariantAttribute = {
      id: `${Date.now()}-${Math.random()}`,
      type: selectedType,
      name,
      displayName,
      values,
    };

    onChange([...attributes, newAttribute]);

    // Reset states
    resetInputs();
  };

  const resetInputs = () => {
    setFormatValues([]);
    setUnitValues([]);
    setFlavorValues([]);
    setPresentationValues([]);
    setCustomName('');
    setCustomValues('');
    setFormatNumber('');
    setUnitNumber('');
    setCustomFlavor('');
  };

  const handleRemoveAttribute = (id: string) => {
    onChange(attributes.filter(attr => attr.id !== id));
  };

  const handleRemoveValue = (type: AttributeType, value: string) => {
    switch (type) {
      case 'formato':
        setFormatValues(formatValues.filter(v => v !== value));
        break;
      case 'unidades':
        setUnitValues(unitValues.filter(v => v !== value));
        break;
      case 'sabor':
        setFlavorValues(flavorValues.filter(v => v !== value));
        break;
      case 'presentacion':
        setPresentationValues(presentationValues.filter(v => v !== value));
        break;
    }
  };

  const getValuesForCurrentType = () => {
    switch (selectedType) {
      case 'formato': return formatValues;
      case 'unidades': return unitValues;
      case 'sabor': return flavorValues;
      case 'presentacion': return presentationValues;
      default: return [];
    }
  };

  const canCreateAttribute = () => {
    switch (selectedType) {
      case 'formato': return formatValues.length > 0;
      case 'unidades': return unitValues.length > 0;
      case 'sabor': return flavorValues.length > 0;
      case 'presentacion': return presentationValues.length > 0;
      case 'personalizado': return customName.trim() && customValues.trim();
      default: return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Atributos de Variantes</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <p className="font-semibold mb-2">¿Qué son los atributos de variantes?</p>
                  <p className="text-sm mb-2">
                    Los atributos definen las características que diferencian cada variante del producto.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ejemplo: Si vendes "Coca-Cola" en diferentes tamaños, el atributo sería "Formato"
                    con valores "250ml, 500ml, 1L, 2L".
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="outline" className="text-xs">
            {attributes.length} {attributes.length === 1 ? 'atributo' : 'atributos'}
          </Badge>
        </div>
        <CardDescription>
          Define las características que diferenciarán tus variantes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selector de Tipo de Atributo */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de Atributo</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(Object.keys(attributeTypeConfig) as AttributeType[]).map((type) => {
              const config = attributeTypeConfig[type];
              const Icon = config.icon;
              const isSelected = selectedType === type;

              return (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setSelectedType(type)}
                        disabled={disabled}
                        className={cn(
                          'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                          'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                          isSelected
                            ? `border-primary ${config.bgColor} shadow-sm`
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', isSelected ? config.color : 'text-muted-foreground')} />
                        <span className={cn(
                          'text-xs font-medium text-center',
                          isSelected ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {config.label}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-semibold mb-1">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Input específico según el tipo */}
        <div className="space-y-4">
          {selectedType === 'formato' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Valores de Formato</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Ingresa el número y selecciona la unidad. Los valores se normalizarán automáticamente.
                        Ejemplo: "250 ml", "1 L", "500 g"
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Cantidad"
                  value={formatNumber}
                  onChange={(e) => setFormatNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFormatValue()}
                  disabled={disabled}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
                <Select value={formatUnit} onValueChange={(v) => setFormatUnit(v as FormatUnit)} disabled={disabled}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddFormatValue}
                  disabled={disabled || !formatNumber || parseFloat(formatNumber) <= 0}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formatValues.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {formatValues.map((value) => (
                    <Badge key={value} variant="secondary" className="gap-1">
                      {value}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue('formato', value)}
                        disabled={disabled}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedType === 'unidades' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Valores de Unidades</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Ingresa solo números enteros. Ejemplo: 6, 12, 24 para paquetes de diferentes cantidades.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Número de unidades"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUnitValue()}
                  disabled={disabled}
                  className="flex-1"
                  min="1"
                  step="1"
                />
                <Button
                  type="button"
                  onClick={handleAddUnitValue}
                  disabled={disabled || !unitNumber || parseInt(unitNumber) <= 0}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {unitValues.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {unitValues.map((value) => (
                    <Badge key={value} variant="secondary" className="gap-1">
                      {value} {parseInt(value) === 1 ? 'unidad' : 'unidades'}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue('unidades', value)}
                        disabled={disabled}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedType === 'sabor' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Valores de Sabor</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Elige sabores predefinidos de la lista o ingresa uno personalizado.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={selectedFlavor} onValueChange={setSelectedFlavor} disabled={disabled}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar sabor predefinido" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_FLAVORS.map((flavor) => (
                        <SelectItem key={flavor} value={flavor}>
                          {flavor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleAddFlavor}
                    disabled={disabled || !selectedFlavor}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O personalizado</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Sabor personalizado"
                    value={customFlavor}
                    onChange={(e) => setCustomFlavor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFlavor()}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFlavor}
                    disabled={disabled || !customFlavor.trim()}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {flavorValues.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {flavorValues.map((value) => (
                    <Badge key={value} variant="secondary" className="gap-1">
                      {value}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue('sabor', value)}
                        disabled={disabled}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedType === 'presentacion' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Valores de Presentación</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Selecciona el tipo de empaque o presentación de la lista predefinida.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex gap-2">
                <Select value={selectedPresentation} onValueChange={setSelectedPresentation} disabled={disabled}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar presentación" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_PRESENTATIONS.map((presentation) => (
                      <SelectItem key={presentation} value={presentation}>
                        {presentation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddPresentation}
                  disabled={disabled || !selectedPresentation}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {presentationValues.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {presentationValues.map((value) => (
                    <Badge key={value} variant="secondary" className="gap-1">
                      {value}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue('presentacion', value)}
                        disabled={disabled}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedType === 'personalizado' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Atributo Personalizado</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs mb-2">
                        Define un atributo que no está en las opciones predefinidas.
                      </p>
                      <p className="text-xs text-amber-500">
                        ⚠️ Usa nombres consistentes para facilitar búsquedas y filtros.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Nombre del atributo (ej: Color, Tamaño)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={disabled}
                />
                <Input
                  placeholder="Valores separados por comas (ej: Rojo, Azul, Verde)"
                  value={customValues}
                  onChange={(e) => setCustomValues(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>

        {/* Botón para crear el atributo */}
        <Button
          type="button"
          onClick={handleCreateAttribute}
          disabled={disabled || !canCreateAttribute()}
          className="w-full"
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Atributo {attributeTypeConfig[selectedType].label}
        </Button>

        {/* Lista de atributos creados */}
        {attributes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Atributos Definidos</Label>
                <Badge variant="outline" className="text-xs">
                  {(() => {
                    const total = attributes.reduce((acc, attr) => acc * attr.values.length, 1);
                    return `${total} ${total === 1 ? 'variante' : 'variantes'}`;
                  })()}
                </Badge>
              </div>

              {attributes.map((attr) => {
                const config = attributeTypeConfig[attr.type];
                const Icon = config.icon;

                return (
                  <div
                    key={attr.id}
                    className="relative p-4 rounded-lg border-2 border-border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn('p-2 rounded-md', config.bgColor)}>
                          <Icon className={cn('h-4 w-4', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-sm">{attr.displayName}</p>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {attr.values.map((value) => (
                              <Badge key={value} variant="secondary" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttribute(attr.id)}
                        disabled={disabled}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {attributes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              No hay atributos definidos aún
            </p>
            <p className="text-xs mt-1">
              Selecciona un tipo de atributo y agrega valores para comenzar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
