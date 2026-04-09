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
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';

interface ProductVariant {
  _id: string;
  sku: string;
  name: string;
  price: number;
  attributes: Record<string, string>;
  image?: string;
  images?: string[];
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

  // Fetch product variants from API
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      api
        .get('/products/variants', {
          params: {
            active: 'true', // Solo productos activos
            limit: 100, // Obtener más productos
          },
        })
        .then((response) => {
          // La respuesta tiene estructura: { success: true, data: { data: [...], pagination: {...} } }
          const variantsData = response.data.data?.data || [];
          setVariants(variantsData);
        })
        .catch((error) => {
          console.error('Error fetching variants:', error);
          setVariants([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
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
  const maxQuantity = 99;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fullScreenMobile className="sm:max-w-[600px]">
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
          <ScrollArea className="h-[40vh] sm:h-[300px] border rounded-lg">
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
              <div className="p-2 space-y-2 sm:space-y-2">
                {filteredVariants.map((variant) => (
                  <button
                    key={variant._id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`w-full text-left p-4 sm:p-3 rounded-xl sm:rounded-lg border transition-colors ${
                      selectedVariant?._id === variant._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex gap-3">
                      {(variant.image || variant.images?.[0]) && (
                        <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                          <img
                            src={variant.image || variant.images?.[0]}
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
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Producto seleccionado:
              </p>
              <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{selectedVariant.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatCurrency(selectedVariant.price)} × cantidad
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
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
                    className="w-16 sm:w-20 text-center"
                    min="1"
                    max={maxQuantity}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    +
                  </Button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {formatCurrency(selectedVariant.price * quantity)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px] sm:min-h-0">
            Cancelar
          </Button>
          <Button onClick={handleSelect} disabled={!canAdd} className="gap-2 min-h-[44px] sm:min-h-0">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
