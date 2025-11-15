'use client';

import { useState } from 'react';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VariantAttribute } from '@/types';

interface VariantAttributesManagerProps {
  attributes: VariantAttribute[];
  onChange: (attributes: VariantAttribute[]) => void;
  disabled?: boolean;
}

export function VariantAttributesManager({
  attributes,
  onChange,
  disabled = false,
}: VariantAttributesManagerProps) {
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeDisplayName, setNewAttributeDisplayName] = useState('');

  const handleAddAttribute = () => {
    if (!newAttributeName.trim() || !newAttributeDisplayName.trim()) return;

    const newAttribute: VariantAttribute = {
      name: newAttributeName.toLowerCase().trim(),
      displayName: newAttributeDisplayName.trim(),
      order: attributes.length,
      values: [],
    };

    onChange([...attributes, newAttribute]);
    setNewAttributeName('');
    setNewAttributeDisplayName('');
  };

  const handleRemoveAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const handleAddValue = (attributeIndex: number, value: string, displayValue: string) => {
    if (!value.trim() || !displayValue.trim()) return;

    const updatedAttributes = [...attributes];
    const attribute = updatedAttributes[attributeIndex];

    // Check if value already exists
    if (attribute.values.some(v => v.value === value.toLowerCase().trim())) {
      return;
    }

    attribute.values.push({
      value: value.toLowerCase().trim(),
      displayValue: displayValue.trim(),
      order: attribute.values.length,
    });

    onChange(updatedAttributes);
  };

  const handleRemoveValue = (attributeIndex: number, valueIndex: number) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[attributeIndex].values = updatedAttributes[attributeIndex].values.filter(
      (_, i) => i !== valueIndex
    );
    onChange(updatedAttributes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atributos de Variantes</CardTitle>
        <CardDescription>
          Define los atributos que diferencian las variantes de este producto (ej: tamaño, sabor, color)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Attribute */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="attr-name">Nombre interno (minúsculas, sin espacios)</Label>
              <Input
                id="attr-name"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="tamaño"
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="attr-display">Nombre para mostrar</Label>
              <Input
                id="attr-display"
                value={newAttributeDisplayName}
                onChange={(e) => setNewAttributeDisplayName(e.target.value)}
                placeholder="Tamaño"
                disabled={disabled}
              />
            </div>
          </div>
          <Button
            onClick={handleAddAttribute}
            disabled={!newAttributeName.trim() || !newAttributeDisplayName.trim() || disabled}
            size="sm"
            variant="secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Atributo
          </Button>
        </div>

        {/* Existing Attributes */}
        {attributes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay atributos de variantes definidos</p>
            <p className="text-xs mt-1">Los productos sin variantes tendrán una sola versión</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attributes.map((attribute, attrIndex) => (
              <AttributeCard
                key={attribute.name}
                attribute={attribute}
                onAddValue={(value, displayValue) => handleAddValue(attrIndex, value, displayValue)}
                onRemoveValue={(valueIndex) => handleRemoveValue(attrIndex, valueIndex)}
                onRemove={() => handleRemoveAttribute(attrIndex)}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {attributes.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Nota:</strong> Cada combinación de valores generará una variante diferente.
              {attributes.length > 1 && (
                <> Por ejemplo, si tienes 3 tamaños y 2 sabores, se crearán 6 variantes (3 × 2).</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AttributeCardProps {
  attribute: VariantAttribute;
  onAddValue: (value: string, displayValue: string) => void;
  onRemoveValue: (valueIndex: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

function AttributeCard({
  attribute,
  onAddValue,
  onRemoveValue,
  onRemove,
  disabled = false,
}: AttributeCardProps) {
  const [newValue, setNewValue] = useState('');
  const [newDisplayValue, setNewDisplayValue] = useState('');

  const handleAdd = () => {
    onAddValue(newValue, newDisplayValue);
    setNewValue('');
    setNewDisplayValue('');
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{attribute.displayName}</p>
            <p className="text-xs text-muted-foreground">({attribute.name})</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Values */}
      <div className="flex flex-wrap gap-2">
        {attribute.values.map((value, index) => (
          <Badge key={value.value} variant="secondary" className="text-sm">
            {value.displayValue}
            <button
              onClick={() => onRemoveValue(index)}
              disabled={disabled}
              className="ml-2 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Add Value */}
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="valor"
          size={10}
          disabled={disabled}
          className="flex-1"
        />
        <Input
          value={newDisplayValue}
          onChange={(e) => setNewDisplayValue(e.target.value)}
          placeholder="Valor para mostrar"
          disabled={disabled}
          className="flex-1"
        />
        <Button
          onClick={handleAdd}
          disabled={!newValue.trim() || !newDisplayValue.trim() || disabled}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {attribute.values.length < 2 && (
        <p className="text-xs text-amber-600">
          ⚠ Debes agregar al menos 2 valores para que sea considerado un atributo de variante
        </p>
      )}
    </div>
  );
}
