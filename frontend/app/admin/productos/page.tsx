'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import {
  Plus, Search, Trash2, Loader2, Upload, Edit, Eye, EyeOff,
  Grid3x3, List, ImageOff, Tag as TagIcon, Filter, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAdminProducts, useProductOperations } from '@/hooks/admin/useAdminProducts';
import { badgeText } from '@/components/admin/products/ProductForm';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

type Filter = 'all' | 'active' | 'inactive' | 'featured' | 'no-image' | 'no-format';
type View = 'list' | 'grid';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [debounced] = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('list');
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: number } | null>(null);

  const params: any = {
    page, limit: 24, search: debounced || undefined,
  };
  if (filter === 'active') params.active = 'true';
  if (filter === 'inactive') params.active = 'false';
  if (filter === 'featured') params.featured = true;

  const { data, isLoading } = useAdminProducts(params);
  const { remove, isDeleting, update } = useProductOperations();

  const allProducts: Product[] = data?.data || [];
  // Filtros locales que no van al backend
  const products = useMemo(() => {
    let r = allProducts;
    if (filter === 'no-image') r = r.filter((p) => !p.images?.length);
    if (filter === 'no-format') r = r.filter((p) => !p.format);
    return r;
  }, [allProducts, filter]);

  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  const filterChips: Array<{ key: Filter; label: string; icon?: React.ComponentType<{ className?: string }> }> = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos', icon: Eye },
    { key: 'inactive', label: 'Inactivos', icon: EyeOff },
    { key: 'featured', label: 'Destacados', icon: TagIcon },
    { key: 'no-image', label: 'Sin imagen', icon: ImageOff },
    { key: 'no-format', label: 'Sin formato', icon: Filter },
  ];

  const toggleActive = (p: Product) => {
    update({ id: p._id, data: { active: !p.active } });
  };
  const savePrice = (id: string) => {
    if (!editingPrice || editingPrice.id !== id) return;
    update({ id, data: { unitPrice: editingPrice.value } });
    setEditingPrice(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">{total} productos en total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/productos/importar">
              <Upload className="mr-2 h-4 w-4" />Importar Excel
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/productos/nuevo">
              <Plus className="mr-2 h-4 w-4" />Nuevo
            </Link>
          </Button>
        </div>
      </div>

      {/* Toolbar: search + filter chips + view toggle */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código de barras…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setPage(1); }}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-1 ml-auto rounded-lg border p-0.5">
              <Button size="sm" variant={view === 'list' ? 'secondary' : 'ghost'} onClick={() => setView('list')}>
                <List className="h-4 w-4" />
              </Button>
              <Button size="sm" variant={view === 'grid' ? 'secondary' : 'ghost'} onClick={() => setView('grid')}>
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterChips.map((c) => {
              const Icon = c.icon;
              const active = filter === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => { setFilter(c.key); setPage(1); }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            No se encontraron productos con los filtros aplicados
          </CardContent>
        </Card>
      ) : view === 'list' ? (
        /* ============== VIEW LIST ============== */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14"></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Precio u.</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Tramos</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const brandName = typeof p.brand === 'object' ? (p.brand as any)?.name : '';
                  const isPriceEditing = editingPrice?.id === p._id;
                  return (
                    <TableRow key={p._id} className={cn(!p.active && 'opacity-60')}>
                      <TableCell>
                        {p.images?.[0] ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                            <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-md bg-muted text-muted-foreground">
                            <ImageOff className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/productos/${p._id}/editar`} className="font-medium line-clamp-1 hover:underline">
                          {p.name}
                        </Link>
                        {p.barcode && <p className="font-mono text-[10px] text-muted-foreground">{p.barcode}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground line-clamp-1">{brandName}</TableCell>
                      <TableCell className="text-right">
                        {isPriceEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              value={editingPrice.value}
                              onChange={(e) => setEditingPrice({ id: p._id, value: parseFloat(e.target.value) || 0 })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') savePrice(p._id);
                                if (e.key === 'Escape') setEditingPrice(null);
                              }}
                              autoFocus
                              className="h-7 w-24 text-right tabular-nums"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingPrice({ id: p._id, value: p.unitPrice })}
                            className="tabular-nums hover:underline cursor-pointer"
                            title="Click para editar"
                          >
                            ${Math.round(p.unitPrice).toLocaleString('es-CL')}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px] whitespace-nowrap">
                          {badgeText(p.saleUnit.type, p.saleUnit.quantity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.tiers && p.tiers.length > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            {p.tiers.length} tramo{p.tiers.length === 1 ? '' : 's'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/productos/${p._id}/editar`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirm(`¿Eliminar "${p.name}"?`) && remove(p._id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* ============== VIEW GRID ============== */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {products.map((p) => (
            <Card key={p._id} className={cn('group overflow-hidden transition-shadow hover:shadow-md', !p.active && 'opacity-60')}>
              <Link href={`/admin/productos/${p._id}/editar`} className="block">
                <div className="relative aspect-square bg-muted">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill sizes="200px" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  {!p.active && (
                    <span className="absolute top-1 left-1 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase">
                      Inactivo
                    </span>
                  )}
                  {p.featured && (
                    <span className="absolute top-1 right-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      ⭐
                    </span>
                  )}
                </div>
              </Link>
              <CardContent className="p-2 space-y-1">
                <Link href={`/admin/productos/${p._id}/editar`}>
                  <p className="text-xs font-semibold line-clamp-2 hover:underline">{p.name}</p>
                </Link>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-sm font-bold tabular-nums">
                    ${Math.round(p.unitPrice).toLocaleString('es-CL')}
                  </span>
                  {p.tiers && p.tiers.length > 0 && (
                    <span className="text-[9px] text-primary font-bold">+{p.tiers.length}</span>
                  )}
                </div>
                <Badge variant="secondary" className="font-mono text-[9px] w-full justify-center">
                  {badgeText(p.saleUnit.type, p.saleUnit.quantity)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="px-4 py-2 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  );
}
