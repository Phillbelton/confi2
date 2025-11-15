'use client';

import { useState } from 'react';
import { Edit, Package, Trash2, Check, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProductVariant } from '@/types';

interface VariantsTableProps {
  variants: ProductVariant[];
  onUpdateVariant: (variantId: string, data: { price?: number; stock?: number }) => void;
  onDeleteVariant: (variantId: string) => void;
  isLoading?: boolean;
}

export function VariantsTable({
  variants,
  onUpdateVariant,
  onDeleteVariant,
  isLoading = false,
}: VariantsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant._id);
    setEditPrice(variant.price.toString());
    setEditStock(variant.stock.toString());
  };

  const handleSave = (variantId: string) => {
    const price = parseFloat(editPrice);
    const stock = parseInt(editStock, 10);

    if (!isNaN(price) && !isNaN(stock)) {
      onUpdateVariant(variantId, { price, stock });
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditPrice('');
    setEditStock('');
  };

  if (variants.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium mb-1">No hay variantes</p>
          <p className="text-sm">Define atributos de variantes para generar variantes automáticamente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variantes del Producto</CardTitle>
        <CardDescription>
          Gestiona el precio y stock de cada variante
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant: ProductVariant) => {
                const isEditing = editingId === variant._id;
                const attributesText = Object.entries(variant.attributes)
                  .map(([key, value]: [string, string]) => `${key}: ${value}`)
                  .join(', ');

                return (
                  <TableRow key={variant._id}>
                    {/* SKU */}
                    <TableCell className="font-mono text-xs">
                      {variant.sku}
                    </TableCell>

                    {/* Variant Name/Attributes */}
                    <TableCell>
                      <div>
                        <p className="font-medium">{variant.name}</p>
                        <p className="text-xs text-muted-foreground">{attributesText}</p>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <span className="font-semibold">${variant.price.toLocaleString()}</span>
                      )}
                    </TableCell>

                    {/* Stock */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-20"
                          min="0"
                        />
                      ) : (
                        <Badge
                          variant={variant.stock > 0 ? 'default' : 'secondary'}
                          className={variant.stock > 0 ? 'bg-green-600' : ''}
                        >
                          {variant.stock}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {variant.active ? (
                        <Badge variant="default" className="bg-green-600">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSave(variant._id)}
                            disabled={isLoading}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(variant)}
                            disabled={isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteVariant(variant._id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span>Total variantes: <strong>{variants.length}</strong></span>
          <span>En stock: <strong>{variants.filter(v => v.stock > 0).length}</strong></span>
          <span>Sin stock: <strong>{variants.filter(v => v.stock === 0).length}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}
