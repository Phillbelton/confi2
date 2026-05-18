'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { productService } from '@/services/products';
import { getImageUrl } from '@/lib/images';
import type { Product } from '@/types';

interface ProductSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: Product) => void;
  excludeIds?: string[];
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

export function ProductSelector({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order-product-picker', search],
    queryFn: () =>
      productService.getProducts({
        search: search || undefined,
        limit: 20,
        active: 'true',
      }),
    enabled: open,
    staleTime: 30_000,
  });

  const products = (data?.data ?? []).filter((p) => !excludeIds.includes(p._id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar producto</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!isLoading && products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No se encontraron productos.
            </p>
          )}
          {products.map((p) => {
            const image = p.images?.[0];
            return (
              <div
                key={p._id}
                className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent"
              >
                {image ? (
                  <img
                    src={getImageUrl(image)}
                    alt={p.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {p.barcode || p.slug}
                  </p>
                  <p className="text-sm">{formatCLP(p.unitPrice)}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onSelect(p);
                    onOpenChange(false);
                  }}
                >
                  Agregar
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
