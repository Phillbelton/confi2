'use client';

import { useState, useMemo } from 'react';
import { Plus, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ProductParent, ProductVariant } from '@/types';

interface AddVariantDialogProps {
  productParent: ProductParent;
  existingVariants: ProductVariant[];
  onAddVariant: (data: {
    attributes: Record<string, string>;
    price: number;
    stock: number;
    sku?: string;
    description?: string;
  }) => void;
  isAdding?: boolean;
}

export function AddVariantDialog({
  productParent,
  existingVariants,
  onAddVariant,
  isAdding = false,
}: AddVariantDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [showNewValueInput, setShowNewValueInput] = useState<Record<string, boolean>>({});

  // Verificar si el producto tiene variantAttributes configurados
  if (!productParent.variantAttributes || productParent.variantAttributes.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Este producto no tiene atributos de variantes configurados.
          No se pueden agregar variantes individuales.
        </AlertDescription>
      </Alert>
    );
  }

  // Generar vista previa del nombre de la variante
  const previewName = useMemo(() => {
    const attrs = productParent.variantAttributes
      .map((attr) => {
        const value = selectedValues[attr.name] || newValues[attr.name];
        return value || '?';
      })
      .filter(Boolean)
      .join(' ');

    return attrs ? `${productParent.name} ${attrs}` : productParent.name;
  }, [productParent.name, productParent.variantAttributes, selectedValues, newValues]);

  // Verificar si la combinación ya existe
  const isDuplicate = useMemo(() => {
    if (!selectedValues || Object.keys(selectedValues).length === 0) return false;

    const currentCombination = JSON.stringify(
      Object.fromEntries(
        productParent.variantAttributes.map((attr) => [
          attr.name,
          selectedValues[attr.name] || newValues[attr.name] || '',
        ])
      )
    );

    return existingVariants.some((v) => {
      const variantCombination = JSON.stringify(v.attributes);
      return currentCombination === variantCombination;
    });
  }, [selectedValues, newValues, existingVariants, productParent.variantAttributes]);

  // Verificar si todos los atributos están seleccionados
  const allAttributesSelected = productParent.variantAttributes.every(
    (attr) => selectedValues[attr.name] || newValues[attr.name]
  );

  const canSubmit =
    allAttributesSelected &&
    !isDuplicate &&
    price &&
    stock &&
    parseFloat(price) > 0 &&
    parseInt(stock) >= 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    // Combinar valores seleccionados y nuevos
    const attributes = productParent.variantAttributes.reduce((acc, attr) => {
      const value = selectedValues[attr.name] || newValues[attr.name];
      if (value) {
        acc[attr.name] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    onAddVariant({
      attributes,
      price: parseFloat(price),
      stock: parseInt(stock),
      ...(sku && { sku }),
      ...(description && { description }),
    });

    // Reset form
    handleReset();
    setOpen(false);
  };

  const handleReset = () => {
    setSelectedValues({});
    setNewValues({});
    setPrice('');
    setStock('');
    setSku('');
    setDescription('');
    setShowNewValueInput({});
  };

  const handleValueChange = (attrName: string, value: string) => {
    if (value === '__new__') {
      setShowNewValueInput((prev) => ({ ...prev, [attrName]: true }));
      setSelectedValues((prev) => ({ ...prev, [attrName]: '' }));
    } else {
      setSelectedValues((prev) => ({ ...prev, [attrName]: value }));
      setNewValues((prev) => {
        const updated = { ...prev };
        delete updated[attrName];
        return updated;
      });
      setShowNewValueInput((prev) => ({ ...prev, [attrName]: false }));
    }
  };

  const handleNewValueInput = (attrName: string, value: string) => {
    setNewValues((prev) => ({ ...prev, [attrName]: value }));
  };

  const handleCancelNewValue = (attrName: string) => {
    setShowNewValueInput((prev) => ({ ...prev, [attrName]: false }));
    setNewValues((prev) => {
      const updated = { ...prev };
      delete updated[attrName];
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Variante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Variante</DialogTitle>
          <DialogDescription>
            Define los atributos y propiedades de la nueva variante.
            Los valores nuevos se agregarán automáticamente a los atributos del producto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="rounded-md border border-dashed border-muted-foreground/30 p-4">
            <Label className="text-xs text-muted-foreground">Vista Previa</Label>
            <p className="text-lg font-medium mt-1">{previewName}</p>
          </div>

          {/* Attributes */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Atributos de la Variante</Label>
            {productParent.variantAttributes.map((attr) => (
              <div key={attr.name} className="space-y-2">
                <Label htmlFor={`attr-${attr.name}`}>{attr.displayName || attr.name}</Label>

                {!showNewValueInput[attr.name] ? (
                  <Select
                    value={selectedValues[attr.name] || ''}
                    onValueChange={(value) => handleValueChange(attr.name, value)}
                  >
                    <SelectTrigger id={`attr-${attr.name}`}>
                      <SelectValue placeholder={`Seleccionar ${attr.displayName || attr.name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {attr.values.map((val) => (
                        <SelectItem key={val.value} value={val.value}>
                          {val.displayValue || val.value}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__" className="text-primary">
                        <Plus className="h-4 w-4 inline mr-2" />
                        Agregar nuevo {attr.displayName || attr.name}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Nuevo ${attr.displayName || attr.name}`}
                      value={newValues[attr.name] || ''}
                      onChange={(e) => handleNewValueInput(attr.name, e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCancelNewValue(attr.name)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                {newValues[attr.name] && (
                  <Badge variant="secondary" className="mt-1">
                    Nuevo: {newValues[attr.name]}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Duplicate warning */}
          {isDuplicate && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ya existe una variante con esta combinación de atributos.
              </AlertDescription>
            </Alert>
          )}

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Inicial *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          {/* Optional fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Opcional)</Label>
              <Input
                id="sku"
                placeholder="Se generará automáticamente si se deja vacío"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                El SKU es inmutable una vez creado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Input
                id="description"
                placeholder="Descripción específica de esta variante"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset();
              setOpen(false);
            }}
            disabled={isAdding}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isAdding}>
            {isAdding ? 'Agregando...' : 'Agregar Variante'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
