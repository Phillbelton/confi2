'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductVariant {
  _id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  trackStock: boolean;
  allowBackorder: boolean;
  attributes: Record<string, string>;
  image?: string;
}

interface ProductSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (variant: ProductVariant, quantity: number) => void;
  excludedVariantIds?: string[];
}

export function ProductSelector({
  open,
  onOpenChange,
  onSelect,
  excludedVariantIds = [],
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - En producción esto vendría de una API
  useEffect(() => {
    if (open) {
      // Aquí iría la llamada a GET /api/products/variants o similar
      // Por ahora usamos datos mock
      setIsLoading(false);
    }
  }, [open]);

  const filteredVariants = variants.filter(
    (v) =>
      !excludedVariantIds.includes(v._id) &&
      (v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = () => {
    if (selectedVariant && quantity > 0) {
      onSelect(selectedVariant, quantity);
      onOpenChange(false);
      setSelectedVariant(null);
      setQuantity(1);
      setSearch('');
    }
  };

  const canAdd = selectedVariant && quantity > 0;
  const maxQuantity = selectedVariant?.trackStock && !selectedVariant?.allowBackorder
    ? selectedVariant.stock
    : 99;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agregar Producto</DialogTitle>
          <DialogDescription>
            Busca y selecciona un producto para agregarlo a la orden
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="pl-10"
            />
          </div>

          {/* Product List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Package className="h-12 w-12 mb-2" />
                <p className="text-sm">
                  {search ? 'No se encontraron productos' : 'Comienza a buscar productos'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredVariants.map((variant) => (
                  <button
                    key={variant._id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedVariant?._id === variant._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex gap-3">
                      {variant.image && (
                        <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                          <img
                            src={variant.image}
                            alt={variant.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{variant.name}</p>
                        <p className="text-xs text-slate-500 font-mono">SKU: {variant.sku}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(variant.price)}
                          </Badge>
                          {variant.trackStock && (
                            <Badge
                              variant={variant.stock > 5 ? 'outline' : 'destructive'}
                              className="text-xs"
                            >
                              Stock: {variant.stock}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selected Product & Quantity */}
          {selectedVariant && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Producto seleccionado:
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold">{selectedVariant.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatCurrency(selectedVariant.price)} × cantidad
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.min(maxQuantity, Math.max(1, val)));
                    }}
                    className="w-20 text-center"
                    min="1"
                    max={maxQuantity}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    +
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Subtotal: <span className="font-semibold">{formatCurrency(selectedVariant.price * quantity)}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSelect} disabled={!canAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' Gs';
}
