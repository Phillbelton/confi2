'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import {
  Plus, Search, Trash2, Loader2, Upload, Edit, Eye, EyeOff,
  Grid3x3, List, ImageOff, Filter, X, Star,
  AlertTriangle, ArrowUpDown, FolderTree, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useAdminProducts, useProductOperations, useAdminProductStats,
} from '@/hooks/admin/useAdminProducts';
import { useCategoriesFlat } from '@/hooks/useCategories';
import { useAdminBrands } from '@/hooks/admin/useAdminBrands';
import { badgeText } from '@/components/admin/products/ProductForm';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';
import type { Product, Category, Brand } from '@/types';
import type { ProductQueryParams } from '@/services/products';

type StatusFilter = 'all' | 'active' | 'inactive' | 'featured' | 'no-image' | 'no-format';
type View = 'list' | 'grid';
type SortKey = NonNullable<ProductQueryParams['sort']>;

// Identidades estables: previenen que useMemo se invalide cada render
// cuando los queries aún no resolvieron (data?.data ?? []) crea una
// referencia nueva cada vez.
const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Recientes primero' },
  { value: 'oldest', label: 'Antiguos primero' },
  { value: 'name_asc', label: 'Nombre A→Z' },
  { value: 'name_desc', label: 'Nombre Z→A' },
  { value: 'price_asc', label: 'Precio menor a mayor' },
  { value: 'price_desc', label: 'Precio mayor a menor' },
  { value: 'popular', label: 'Más vistos' },
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [debounced] = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [brandId, setBrandId] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [view, setView] = useState<View>('list');
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  // Backend params
  const params: ProductQueryParams = {
    page,
    limit: 24,
    search: debounced || undefined,
    sort,
  };
  if (status === 'active') params.active = 'true';
  else if (status === 'inactive') params.active = 'false';
  else if (status === 'featured') params.featured = true;
  else params.active = 'all';
  if (categoryId !== 'all') params.category = categoryId;
  if (brandId !== 'all') params.brand = brandId;

  const { data, isLoading } = useAdminProducts(params);
  const { data: stats } = useAdminProductStats();
  const { data: categoriesData } = useCategoriesFlat();
  const { data: brandsData } = useAdminBrands();
  const { remove, isDeleting, update } = useProductOperations();

  const categories: Category[] = categoriesData ?? EMPTY_CATEGORIES;

  const brands: Brand[] = useMemo(() => {
    const raw: unknown = brandsData;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const obj = raw as { data?: unknown; brands?: unknown };
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.brands)) return obj.brands;
    }
    return [];
  }, [brandsData]);

  const allProducts: Product[] = data?.data ?? EMPTY_PRODUCTS;
  const products = useMemo(() => {
    let r = allProducts;
    if (status === 'no-image') r = r.filter((p) => !p.images?.length);
    if (status === 'no-format') r = r.filter((p) => !p.format);
    return r;
  }, [allProducts, status]);

  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  const hasActiveFilters =
    !!debounced ||
    status !== 'all' ||
    categoryId !== 'all' ||
    brandId !== 'all' ||
    sort !== 'newest';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setCategoryId('all');
    setBrandId('all');
    setSort('newest');
    setPage(1);
  };

  const filterChips: Array<{
    key: StatusFilter; label: string;
    icon?: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { key: 'all', label: 'Todos', count: stats?.total },
    { key: 'active', label: 'Activos', icon: Eye, count: stats?.active },
    { key: 'inactive', label: 'Inactivos', icon: EyeOff, count: stats?.inactive },
    { key: 'featured', label: 'Destacados', icon: Star, count: stats?.featured },
    { key: 'no-image', label: 'Sin imagen', icon: ImageOff, count: stats?.noImage },
    { key: 'no-format', label: 'Sin formato', icon: Filter, count: stats?.noFormat },
  ];

  const toggleActive = (p: Product) => update({ id: p._id, data: { active: !p.active } });
  const toggleFeatured = (p: Product) => update({ id: p._id, data: { featured: !p.featured } });
  const savePrice = (id: string) => {
    if (!editingPrice || editingPrice.id !== id) return;
    update({ id, data: { unitPrice: editingPrice.value } });
    setEditingPrice(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            {total} productos {hasActiveFilters ? '(filtrados)' : 'en total'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/importar">
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

      {/* Stats banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <StatTile label="Total" value={stats.total} />
          <StatTile label="Activos" value={stats.active} tone="success" />
          <StatTile label="Inactivos" value={stats.inactive} tone="muted" />
          <StatTile label="Destacados" value={stats.featured} tone="accent" />
          <StatTile label="Sin imagen" value={stats.noImage} tone="warn" />
          <StatTile label="Sin marca" value={stats.noBrand} tone="warn" />
          <StatTile label="Sin formato" value={stats.noFormat} tone="warn" />
        </div>
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Row 1: search + view toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-md">
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

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex gap-1 ml-auto rounded-lg border p-0.5">
              <Button size="sm" variant={view === 'list' ? 'secondary' : 'ghost'} onClick={() => setView('list')}>
                <List className="h-4 w-4" />
              </Button>
              <Button size="sm" variant={view === 'grid' ? 'secondary' : 'ghost'} onClick={() => setView('grid')}>
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: category + brand + clear */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1); }}>
              <SelectTrigger className="w-[220px]">
                <FolderTree className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.parent ? '↳ ' : ''}{c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandId} onValueChange={(v) => { setBrandId(v); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <BadgeCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Row 3: status chips with counters */}
          <div className="flex flex-wrap gap-2">
            {filterChips.map((c) => {
              const Icon = c.icon;
              const active = status === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => { setStatus(c.key); setPage(1); }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {c.label}
                  {typeof c.count === 'number' && (
                    <span
                      className={cn(
                        'ml-0.5 rounded-full px-1.5 py-0 text-[10px] font-bold',
                        active ? 'bg-primary-foreground/20' : 'bg-muted'
                      )}
                    >
                      {c.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* List / empty / loading */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground space-y-3">
            <p>No se encontraron productos con los filtros aplicados</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === 'list' ? (
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
                  <TableHead className="text-center">⭐</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const brandName = typeof p.brand === 'object' && p.brand ? (p.brand as Brand).name : '';
                  const isPriceEditing = editingPrice?.id === p._id;
                  const issues = collectIssues(p);
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
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/admin/productos/${p._id}/editar`}
                              className="font-medium line-clamp-1 hover:underline"
                            >
                              {p.name}
                            </Link>
                            {p.barcode && (
                              <p className="font-mono text-[10px] text-muted-foreground">{p.barcode}</p>
                            )}
                          </div>
                          {issues.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center text-amber-500 cursor-help">
                                  <AlertTriangle className="h-4 w-4" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <ul className="text-xs space-y-0.5">
                                  {issues.map((i) => <li key={i}>• {i}</li>)}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground line-clamp-1">
                        {brandName || <span className="text-amber-600">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPriceEditing ? (
                          <Input
                            type="number"
                            value={editingPrice.value}
                            onChange={(e) => setEditingPrice({ id: p._id, value: parseFloat(e.target.value) || 0 })}
                            onBlur={() => savePrice(p._id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePrice(p._id);
                              if (e.key === 'Escape') setEditingPrice(null);
                            }}
                            autoFocus
                            className="h-7 w-24 text-right tabular-nums"
                          />
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
                        <button
                          type="button"
                          onClick={() => toggleFeatured(p)}
                          title={p.featured ? 'Quitar destacado' : 'Marcar destacado'}
                          className={cn(
                            'p-1 rounded transition-colors',
                            p.featured ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Star className={cn('h-4 w-4', p.featured && 'fill-amber-500')} />
                        </button>
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
                            onClick={() => setPendingDelete(p)}
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
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {products.map((p) => {
            const issues = collectIssues(p);
            return (
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
                    {issues.length > 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white" title={issues.join(', ')}>
                        ⚠ {issues.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); toggleFeatured(p); }}
                      className={cn(
                        'absolute top-1 right-1 rounded p-1 transition-colors',
                        p.featured ? 'bg-amber-500 text-white' : 'bg-background/80 text-muted-foreground hover:text-foreground'
                      )}
                      title={p.featured ? 'Quitar destacado' : 'Marcar destacado'}
                    >
                      <Star className={cn('h-3 w-3', p.featured && 'fill-white')} />
                    </button>
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
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="px-4 py-2 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  Vas a eliminar <strong>{pendingDelete.name}</strong>. El producto se marca como
                  inactivo y deja de aparecer en el catálogo público, pero las órdenes históricas
                  que lo contienen se mantienen intactas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  remove(pendingDelete._id);
                  setPendingDelete(null);
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando…</>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function collectIssues(p: Product): string[] {
  const issues: string[] = [];
  if (!p.images || p.images.length === 0) issues.push('Sin imagen');
  if (!p.brand) issues.push('Sin marca');
  if (!p.format) issues.push('Sin formato');
  if (!p.categories || (p.categories as unknown[]).length === 0) issues.push('Sin categoría');
  return issues;
}

interface StatTileProps {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'muted' | 'accent' | 'warn';
}

function StatTile({ label, value, tone = 'default' }: StatTileProps) {
  const toneClasses: Record<NonNullable<StatTileProps['tone']>, string> = {
    default: 'border-border bg-card',
    success: 'border-emerald-500/20 bg-emerald-500/5',
    muted: 'border-border bg-muted/40',
    accent: 'border-amber-500/30 bg-amber-500/5',
    warn: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20',
  };
  return (
    <div className={cn('rounded-lg border p-3 flex flex-col', toneClasses[tone])}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tabular-nums">{value}</span>
    </div>
  );
}
