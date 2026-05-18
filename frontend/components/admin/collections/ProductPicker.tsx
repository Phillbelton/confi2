'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/axios';
import { getSafeImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

interface ProductRow {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  active: boolean;
}

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  /** IDs ya seleccionados — se muestran con check */
  selectedIds: string[];
  /** Toggle (agrega si no está, quita si está) */
  onToggle: (productId: string) => void;
}

export function ProductPicker({
  open,
  onClose,
  selectedIds,
  onToggle,
}: ProductPickerProps) {
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products-picker', search],
    queryFn: async () => {
      const params = new URLSearchParams({ active: 'true', limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      const { data } = await api.get(`/products?${params.toString()}`);
      return (data.data?.data || []) as ProductRow[];
    },
    enabled: open,
    staleTime: 1000 * 30,
  });

  const selectedSet = new Set(selectedIds);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar productos a la colección</DialogTitle>
          <DialogDescription>
            Tap para agregar/quitar. Los seleccionados aparecen marcados.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[420px] -mx-4 px-4">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search ? 'Sin coincidencias' : 'No hay productos disponibles'}
            </p>
          ) : (
            <ul className="space-y-1.5 py-2">
              {products.map((p) => {
                const checked = selectedSet.has(p._id);
                const img = getSafeImageUrl(p.images?.[0], {
                  width: 80,
                  height: 80,
                });
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => onToggle(p._id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                        checked
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/40'
                      )}
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={img}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                          {p.slug}
                        </p>
                      </div>
                      {checked && (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            <strong>{selectedIds.length}</strong> seleccionados
          </p>
          <Button onClick={onClose}>Listo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
