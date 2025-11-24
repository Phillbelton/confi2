'use client';

import { useState } from 'react';
import { Search, Plus, Check, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getImageUrl } from '@/lib/images';
import { hasActiveDiscount } from '@/lib/discountCalculator';

interface ProductVariant {
  _id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  images: string[];
  active: boolean;
  inStock: boolean;
}

interface ProductSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (variant: ProductVariant) => void;
  selectedVariantIds?: string[];
}

export function ProductSelector({
  open,
  onClose,
  onSelect,
  selectedVariantIds = [],
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');

  // Fetch variants
  const { data: variants, isLoading } = useQuery({
    queryKey: ['variants-search', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('active', 'true');
      params.append('limit', '50');

      const { data } = await api.get(`/products/variants?${params.toString()}`);
      return data.data.data as ProductVariant[];
    },
    enabled: open,
  });

  const handleSelect = (variant: ProductVariant) => {
    onSelect(variant);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Buscar Producto</DialogTitle>
          <DialogDescription>
            Busca un producto para agregarlo a la orden
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o atributos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Results */}
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Buscando productos...
              </div>
            )}

            {!isLoading && (!variants || variants.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron productos
              </div>
            )}

            <div className="space-y-2">
              {variants?.map((variant) => {
                const isSelected = selectedVariantIds.includes(variant._id);
                const attributes = Object.entries(variant.attributes || {});
                const hasDiscount = hasActiveDiscount(variant as any, (variant as any).parent);

                return (
                  <div
                    key={variant._id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => !isSelected && handleSelect(variant)}
                  >
                    {/* Image */}
                    {variant.images?.[0] && (
                      <img
                        src={getImageUrl(variant.images[0])}
                        alt={variant.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{variant.name}</p>
                        {isSelected && (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="h-3 w-3" />
                            Ya agregado
                          </Badge>
                        )}
                        {!isSelected && hasDiscount && (
                          <Badge variant="default" className="gap-1 text-xs bg-green-600">
                            <Tag className="h-3 w-3" />
                            Con descuento
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{variant.sku}</span>
                        {attributes.length > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {attributes.map(([key, value]) => value).join(', ')}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-semibold">
                          ${variant.price.toLocaleString('es-PY')}
                        </span>
                        {variant.stock > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            Stock: {variant.stock}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Sin stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {!isSelected && (
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
