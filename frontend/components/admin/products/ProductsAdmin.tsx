'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, useEffect } from 'react';
import {
  BadgePercent, Boxes, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink,
  EyeOff, ImageOff, LayoutGrid, Loader2, Package, Pencil, Plus, Rows3, Search,
  Star, Trash2, X, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useAdminProducts, useAdminProductStats, useProductOperations,
} from '@/hooks/admin/useAdminProducts';
import { useCategoriesFlat } from '@/hooks/useCategories';
import { useAdminBrands } from '@/hooks/admin/useAdminBrands';
import { useDebounce } from 'use-debounce';
import {
  discountedUnitPrice, getFixedDiscountBadge, hasActiveFixedDiscount, priceFrom,
} from '@/lib/discountCalculator';
import { getImageUrl } from '@/lib/images';
import { PageHeader, StatCard, EmptyState, type StatTone } from '@/components/admin/kit';
import { cn } from '@/lib/utils';
import type { Product, Category, Brand, SaleUnitType } from '@/types';
import type { ProductQueryParams } from '@/services/products';

type StatusFilter = 'all' | 'active' | 'inactive' | 'featured' | 'no-image';
type View = 'table' | 'grid';
type SortKey = NonNullable<ProductQueryParams['sort']>;

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Recientes primero' },
  { value: 'oldest', label: 'Antiguos primero' },
  { value: 'name_asc', label: 'Nombre A→Z' },
  { value: 'name_desc', label: 'Nombre Z→A' },
  { value: 'price_asc', label: 'Precio ↑' },
  { value: 'price_desc', label: 'Precio ↓' },
  { value: 'popular', label: 'Más vistos' },
];

const PRES_SHORT: Record<SaleUnitType, string> = {
  unidad: 'U',
  cantidadMinima: 'CM',
  display: 'D',
  embalaje: 'E',
};

const CLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

function brandName(p: Product): string | undefined {
  return typeof p.brand === 'object' && p.brand ? (p.brand as Brand).name : undefined;
}

function categoryNames(p: Product): string[] {
  return (p.categories || [])
    .map((c) => (typeof c === 'object' && c ? (c as Category).name : null))
    .filter(Boolean) as string[];
}

/**
 * Gestión de productos. KPIs clicables,
 * filtros server-side reales (incl. activo/inactivo, que en la página actual
 * quedaba pisado por el servicio), tabla densa con acciones en línea y vista
 * de tarjetas. Atajo "/" enfoca el buscador.
 */
export function ProductsAdmin() {
  const [search, setSearch] = useState('');
  const [debounced] = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [onSale, setOnSale] = useState(false);
  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [limit, setLimit] = useState(24);
  const [view, setView] = useState<View>('table');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Atajo "/" → enfocar buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset de página al cambiar cualquier filtro. Patrón "adjust state during
  // render" (React docs) en lugar de un useEffect con setState, que el
  // compiler marca como cascada de renders.
  const filterKey = `${debounced}|${status}|${onSale}|${categoryId}|${brandId}|${sort}|${limit}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const params: ProductQueryParams = { page, limit, sort };
  if (debounced) params.search = debounced;
  if (status === 'active') params.active = 'true';
  else if (status === 'inactive') params.active = 'false';
  else if (status === 'featured') params.featured = true;
  if (onSale) params.onSale = true;
  if (categoryId !== 'all') params.category = categoryId;
  if (brandId !== 'all') params.brand = brandId;

  const { data, isLoading, isFetching } = useAdminProducts(params);
  const { data: stats } = useAdminProductStats();
  const { data: categoriesData } = useCategoriesFlat();
  const { data: brandsData } = useAdminBrands();
  const { update, remove, isDeleting } = useProductOperations();

  const categories: Category[] = categoriesData ?? EMPTY_CATEGORIES;
  const brands: Brand[] = useMemo(() => {
    const raw: unknown = brandsData;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const obj = raw as { data?: unknown; brands?: unknown };
      if (Array.isArray(obj.data)) return obj.data as Brand[];
      if (Array.isArray(obj.brands)) return obj.brands as Brand[];
    }
    return [];
  }, [brandsData]);

  const allProducts: Product[] = data?.data ?? EMPTY_PRODUCTS;
  const products = useMemo(
    () => (status === 'no-image' ? allProducts.filter((p) => !p.images?.length) : allProducts),
    [allProducts, status]
  );

  const total = data?.pagination?.total ?? data?.pagination?.totalItems ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const rangeFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeTo = Math.min(page * limit, total);

  const hasFilters =
    !!debounced || status !== 'all' || onSale || categoryId !== 'all' || brandId !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setOnSale(false);
    setCategoryId('all');
    setBrandId('all');
    setSort('newest');
  };

  const kpis: {
    key: StatusFilter;
    label: string;
    value?: number;
    icon: LucideIcon;
    tone: StatTone;
  }[] = [
    { key: 'all', label: 'Total', value: stats?.total, icon: Package, tone: 'default' },
    { key: 'active', label: 'Activos', value: stats?.active, icon: CheckCircle2, tone: 'ok' },
    { key: 'inactive', label: 'Inactivos', value: stats?.inactive, icon: EyeOff, tone: 'neutral' },
    { key: 'featured', label: 'Destacados', value: stats?.featured, icon: Star, tone: 'warn' },
    { key: 'no-image', label: 'Sin imagen', value: stats?.noImage, icon: ImageOff, tone: 'crit' },
  ];

  const pageList = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    const list = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    let prev = 0;
    for (const n of list) {
      if (prev && n - prev > 1) out.push('…');
      out.push(n);
      prev = n;
    }
    return out;
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Productos"
        breadcrumbs={[{ label: 'Catálogo', href: '/admin/productos' }, { label: 'Productos' }]}
        meta={
          <span className="inline-flex items-center gap-2">
            {total.toLocaleString('es-CL')} en el catálogo
            {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </span>
        }
        actions={
          <Button asChild data-testid="new-product">
            <Link href="/admin/productos/nuevo">
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        }
      />

      {/* ── KPIs clicables: cada uno filtra la tabla ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <StatCard
            key={k.key}
            label={k.label}
            value={k.value !== undefined ? k.value : '—'}
            icon={k.icon}
            tone={k.tone}
            selected={status === k.key}
            onClick={() => setStatus(k.key)}
            data-testid={`kpi-${k.key}`}
          />
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="rounded-2xl border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o código…"
              className="h-10 pl-9 pr-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground md:block">
                /
              </kbd>
            )}
          </div>

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-10 w-[160px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => setOnSale((v) => !v)}
            className={cn(
              'inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all',
              onSale
                ? 'border-orange-400/60 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <BadgePercent className="h-3.5 w-3.5" />
            En oferta
          </button>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-10 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-xs text-muted-foreground">
                <X className="mr-1 h-3.5 w-3.5" />Limpiar
              </Button>
            )}
            <div className="flex overflow-hidden rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => setView('table')}
                className={cn(
                  'grid h-8 w-9 place-items-center rounded-md transition-all',
                  view === 'table' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground'
                )}
                aria-label="Vista tabla"
              >
                <Rows3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'grid h-8 w-9 place-items-center rounded-md transition-all',
                  view === 'grid' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground'
                )}
                aria-label="Vista tarjetas"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      {isLoading ? (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/5 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={hasFilters ? 'Sin resultados con estos filtros' : 'Aún no hay productos'}
          description={
            hasFilters
              ? 'Prueba ajustar la búsqueda o limpiar los filtros.'
              : 'Crea el primer producto para verlo en el catálogo.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/admin/productos/nuevo">
                  <Plus className="mr-1.5 h-4 w-4" />Nuevo producto
                </Link>
              </Button>
            )
          }
        />
      ) : view === 'table' ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-2.5">Producto</th>
                  <th className="px-3 py-2.5">Categorías</th>
                  <th className="px-3 py-2.5">Presentaciones</th>
                  <th className="px-3 py-2.5 text-right">Precio</th>
                  <th className="px-3 py-2.5 text-center">Activo</th>
                  <th className="px-2 py-2.5 text-center">★</th>
                  <th className="px-3 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const img = p.images?.[0];
                  const cats = categoryNames(p);
                  const promo = hasActiveFixedDiscount(p);
                  const multi = (p.presentaciones?.length ?? 0) > 1;
                  const shown = multi ? priceFrom(p) : discountedUnitPrice(p);
                  const struck = !multi && promo && shown < p.unitPrice;
                  return (
                    <tr key={p._id} className="group border-b transition-colors last:border-0 hover:bg-muted/30">
                      {/* Producto */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border bg-muted">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getImageUrl(img)}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center">
                                <ImageOff className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                            )}
                            {promo && (
                              <span className="absolute inset-x-0 bottom-0 bg-orange-500 py-px text-center text-[8px] font-bold uppercase text-white">
                                {getFixedDiscountBadge(p).slice(0, 8)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium leading-tight">{p.name}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              {p.sku && <span className="font-mono">{p.sku}</span>}
                              {brandName(p) && (
                                <>
                                  <span className="text-border">·</span>
                                  <span>{brandName(p)}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Categorías */}
                      <td className="px-3 py-2.5">
                        <div className="flex max-w-[180px] flex-wrap gap-1">
                          {cats.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <>
                              {cats.slice(0, 2).map((c) => (
                                <span key={c} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {c}
                                </span>
                              ))}
                              {cats.length > 2 && (
                                <span className="rounded-md px-1 py-0.5 text-[10px] text-muted-foreground">
                                  +{cats.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Presentaciones */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(p.presentaciones?.length ? p.presentaciones : [{ _id: 'legacy', type: p.saleUnit.type, quantity: p.saleUnit.quantity, principal: true }]).map((pr) => (
                            <Tooltip key={pr._id}>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums',
                                    pr.principal
                                      ? 'border-primary/40 bg-primary/10 text-primary'
                                      : 'border-border text-muted-foreground'
                                  )}
                                >
                                  {PRES_SHORT[pr.type as SaleUnitType]}×{pr.quantity}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {pr.type} · {pr.quantity} u{pr.principal ? ' · principal' : ''}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </td>

                      {/* Precio */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold tabular-nums">
                            {multi && <span className="mr-1 text-[10px] font-normal uppercase text-muted-foreground">desde</span>}
                            {CLP(shown)}
                          </span>
                          {struck && (
                            <span className="text-[11px] tabular-nums text-muted-foreground line-through">
                              {CLP(p.unitPrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Activo */}
                      <td className="px-3 py-2.5 text-center">
                        <Switch
                          checked={p.active}
                          onCheckedChange={(c) => update({ id: p._id, data: { active: c } })}
                          aria-label={p.active ? 'Desactivar' : 'Activar'}
                        />
                      </td>

                      {/* Destacado */}
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => update({ id: p._id, data: { featured: !p.featured } })}
                          className={cn(
                            'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                            p.featured ? 'text-amber-500 hover:bg-amber-500/10' : 'text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground'
                          )}
                          aria-label={p.featured ? 'Quitar destacado' : 'Destacar'}
                        >
                          <Star className={cn('h-4 w-4', p.featured && 'fill-amber-500')} />
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                          {p.slug && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                  <a href={`/productos/${p.slug}`} target="_blank" rel="noreferrer" aria-label="Ver ficha pública">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Ver ficha pública</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                <Link href={`/admin/productos/${p._id}/editar`} aria-label="Editar">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPendingDelete(p)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                aria-label="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">Eliminar</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Vista tarjetas ── */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => {
            const img = p.images?.[0];
            const promo = hasActiveFixedDiscount(p);
            const multi = (p.presentaciones?.length ?? 0) > 1;
            const shown = multi ? priceFrom(p) : discountedUnitPrice(p);
            return (
              <div
                key={p._id}
                className={cn(
                  'group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md',
                  !p.active && 'opacity-60'
                )}
              >
                <div className="relative aspect-square bg-muted">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  {promo && (
                    <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white shadow">
                      {getFixedDiscountBadge(p)}
                    </span>
                  )}
                  {!p.active && (
                    <span className="absolute right-2 top-2 rounded-md bg-background/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground shadow">
                      Inactivo
                    </span>
                  )}
                  <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="secondary" size="sm" asChild className="h-7 w-7 rounded-lg p-0 shadow">
                      <Link href={`/admin/productos/${p._id}/editar`} aria-label="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPendingDelete(p)}
                      className="h-7 w-7 rounded-lg p-0 text-destructive shadow"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 min-h-[2rem] text-[12px] font-medium leading-tight">{p.name}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-bold tabular-nums">
                      {multi && <span className="mr-0.5 text-[9px] font-normal uppercase text-muted-foreground">desde</span>}
                      {CLP(shown)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => update({ id: p._id, data: { featured: !p.featured } })}
                        className={cn('grid h-6 w-6 place-items-center rounded-md', p.featured ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-muted-foreground')}
                        aria-label="Destacar"
                      >
                        <Star className={cn('h-3.5 w-3.5', p.featured && 'fill-amber-500')} />
                      </button>
                      <Switch
                        checked={p.active}
                        onCheckedChange={(c) => update({ id: p._id, data: { active: c } })}
                        className="scale-[0.8]"
                        aria-label="Activo"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Paginación ── */}
      {!isLoading && products.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs tabular-nums text-muted-foreground">
            Mostrando {rangeFrom.toLocaleString('es-CL')}–{rangeTo.toLocaleString('es-CL')} de {total.toLocaleString('es-CL')}
          </p>
          <div className="flex items-center gap-2">
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[24, 48, 96].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} por página</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 w-8 p-0"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pageList.map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1.5 text-xs text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={n}
                    variant={n === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPage(n)}
                    className="h-8 min-w-8 px-2 text-xs tabular-nums"
                  >
                    {n}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 p-0"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmación de borrado ── */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <span className="font-semibold text-foreground">{pendingDelete?.name}</span>
              {pendingDelete?.sku && <span className="font-mono"> ({pendingDelete.sku})</span>}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                if (pendingDelete) {
                  remove(pendingDelete._id, { onSettled: () => setPendingDelete(null) });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductsAdmin;
