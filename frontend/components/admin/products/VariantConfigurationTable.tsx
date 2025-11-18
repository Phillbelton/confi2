'use client';

import { useState } from 'react';
import { Upload, DollarSign, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VariantImageUploader, VariantImageFile } from './VariantImageUploader';

export interface VariantCombination {
  id: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  images?: VariantImageFile[];
  sku?: string;
}

interface VariantConfigurationTableProps {
  combinations: VariantCombination[];
  onChange: (combinations: VariantCombination[]) => void;
  disabled?: boolean;
}

export function VariantConfigurationTable({
  combinations,
  onChange,
  disabled = false,
}: VariantConfigurationTableProps) {
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  const handleUpdateVariant = (id: string, field: 'price' | 'stock' | 'sku', value: string | number) => {
    const updated = combinations.map((combo) => {
      if (combo.id === id) {
        return {
          ...combo,
          [field]: field === 'price' || field === 'stock' ? Number(value) : value,
        };
      }
      return combo;
    });
    onChange(updated);
  };

  const handleApplyBulkPrice = () => {
    const price = parseFloat(bulkPrice);
    if (!isNaN(price) && price >= 0) {
      const updated = combinations.map((combo) => ({
        ...combo,
        price,
      }));
      onChange(updated);
      setBulkPrice('');
    }
  };

  const handleApplyBulkStock = () => {
    const stock = parseInt(bulkStock, 10);
    if (!isNaN(stock) && stock >= 0) {
      const updated = combinations.map((combo) => ({
        ...combo,
        stock,
      }));
      onChange(updated);
      setBulkStock('');
    }
  };

  const handleUpdateVariantImages = (id: string, images: VariantImageFile[]) => {
    const updated = combinations.map((combo) => {
      if (combo.id === id) {
        return {
          ...combo,
          images,
        };
      }
      return combo;
    });
    onChange(updated);
  };

  // Calculate summary stats
  const totalVariants = combinations.length;
  const configuredVariants = combinations.filter(
    (c) => c.price > 0 && c.stock >= 0
  ).length;
  const totalStock = combinations.reduce((sum, c) => sum + (c.stock || 0), 0);
  const avgPrice = combinations.length > 0
    ? combinations.reduce((sum, c) => sum + (c.price || 0), 0) / combinations.length
    : 0;

  if (combinations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium mb-1">No hay combinaciones</p>
          <p className="text-sm">Define atributos de variantes para generar combinaciones</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Variantes</CardTitle>
        <CardDescription>
          Configure precio y stock para cada variante. Las imágenes son opcionales.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="bulkPrice" className="text-xs">Precio para todas</Label>
              <Input
                id="bulkPrice"
                type="number"
                placeholder="Ej: 5000"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                disabled={disabled}
                min="0"
                step="0.01"
              />
            </div>
            <Button
              onClick={handleApplyBulkPrice}
              disabled={disabled || !bulkPrice}
              className="self-end"
              variant="outline"
              size="sm"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Aplicar
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="bulkStock" className="text-xs">Stock para todas</Label>
              <Input
                id="bulkStock"
                type="number"
                placeholder="Ej: 100"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                disabled={disabled}
                min="0"
              />
            </div>
            <Button
              onClick={handleApplyBulkStock}
              disabled={disabled || !bulkStock}
              className="self-end"
              variant="outline"
              size="sm"
            >
              <Package className="h-4 w-4 mr-1" />
              Aplicar
            </Button>
          </div>
        </div>

        {/* Variants Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variante</TableHead>
                <TableHead>SKU (Opcional)</TableHead>
                <TableHead>Precio (Gs) *</TableHead>
                <TableHead>Stock *</TableHead>
                <TableHead>Imágenes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinations.map((combo) => {
                const attributesText = Object.entries(combo.attributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ');

                return (
                  <TableRow key={combo.id}>
                    {/* Variant Attributes */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{attributesText}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {combo.id.slice(0, 8)}
                        </p>
                      </div>
                    </TableCell>

                    {/* SKU */}
                    <TableCell>
                      <Input
                        type="text"
                        value={combo.sku || ''}
                        onChange={(e) => handleUpdateVariant(combo.id, 'sku', e.target.value)}
                        placeholder="Auto-generado"
                        disabled={disabled}
                        className="w-32 text-xs font-mono"
                      />
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <Input
                        type="number"
                        value={combo.price || ''}
                        onChange={(e) => handleUpdateVariant(combo.id, 'price', e.target.value)}
                        placeholder="0"
                        disabled={disabled}
                        min="0"
                        step="0.01"
                        className="w-28"
                        required
                      />
                    </TableCell>

                    {/* Stock */}
                    <TableCell>
                      <Input
                        type="number"
                        value={combo.stock || ''}
                        onChange={(e) => handleUpdateVariant(combo.id, 'stock', e.target.value)}
                        placeholder="0"
                        disabled={disabled}
                        min="0"
                        className="w-24"
                        required
                      />
                    </TableCell>

                    {/* Images */}
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={disabled}>
                            <Upload className="h-4 w-4 mr-1" />
                            {combo.images && combo.images.length > 0
                              ? `${combo.images.length} imagen(es)`
                              : 'Imágenes'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Imágenes de Variante</DialogTitle>
                            <DialogDescription>
                              {Object.entries(combo.attributes)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')}
                            </DialogDescription>
                          </DialogHeader>
                          <VariantImageUploader
                            images={combo.images || []}
                            onChange={(images) => handleUpdateVariantImages(combo.id, images)}
                            maxImages={5}
                            disabled={disabled}
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
          <div>
            <p className="text-muted-foreground">Total Variantes</p>
            <p className="text-2xl font-bold">{totalVariants}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Configuradas</p>
            <p className="text-2xl font-bold text-green-600">{configuredVariants}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Stock Total</p>
            <p className="text-2xl font-bold">{totalStock}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Precio Promedio</p>
            <p className="text-2xl font-bold">Gs {avgPrice.toLocaleString()}</p>
          </div>
        </div>

        {/* Validation Message */}
        {configuredVariants < totalVariants && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
            <p className="font-medium">⚠️ Atención</p>
            <p>
              Hay {totalVariants - configuredVariants} variante(s) sin configurar.
              Asegúrate de establecer precio y stock para todas las variantes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
