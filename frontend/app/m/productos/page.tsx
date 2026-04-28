'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Check,
  Flame,
  Layers,
  Package,
  Sliders,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CategoryChips } from '@/components/m/shell/CategoryChips';
import { FilterChipsBar } from '@/components/m/catalog/FilterChipsBar';
import { ProductGridM } from '@/components/m/catalog/ProductGridM';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { useCollection } from '@/hooks/useCollections';
import { useFacets } from '@/hooks/useFacets';
import type { ProductParent, Category, Brand } from '@/types';
import { cn } from '@/lib/utils';

const SORTS: {
  value: string;
  label: string;
  short: string;
  emoji: string;
  icon: typeof Sparkles;
  gradient: string;
}[] = [
  {
    value: 'newest',
    label: 'Más nuevos',
    short: 'Recientes',
    emoji: '✨',
    icon: Sparkles,
    gradient: 'from-primary to-secondary',
  },
  {
    value: 'price:asc',
    label: 'Precio menor a mayor',
    short: 'Menor precio',
    emoji: '💰',
    icon: ArrowDownWideNarrow,
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    value: 'price:desc',
    label: 'Precio mayor a menor',
    short: 'Mayor precio',
    emoji: '💎',
    icon: ArrowUpWideNarrow,
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    value: 'name',
    label: 'Alfabético A–Z',
    short: 'A → Z',
    emoji: '🔤',
    icon: ArrowDownAZ,
    gradient: 'from-purple-400 to-fuchsia-500',
  },
];

const PAGE_SIZE = 12;

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || undefined;
  const categorySlug = searchParams.get('categoria') || undefined;
  const subcategorySlug = searchParams.get('subcategoria') || undefined;
  const brandsParam = searchParams.get('brands') || '';
  const onSale = searchParams.get('onSale') === 'true' || undefined;
  const featured = searchParams.get('featured') === 'true' || undefined;
  const collectionSlug = searchParams.get('coleccion') || undefined;
  const sort = searchParams.get('sort') || 'newest';

  const brands = brandsParam ? brandsParam.split(',').filter(Boolean) : [];

  const { data: categories } = useCategories();
  const { data: brandsData } = useBrands();

  const allCategories: Category[] = (categories as Category[]) || [];
  const allBrands: Brand[] = (brandsData?.data as Brand[] | undefined) || [];

  const categoryId = useMemo(() => {
    if (!categorySlug) return undefined;
    return allCategories.find((c) => c.slug === categorySlug)?._id;
  }, [allCategories, categorySlug]);

  const subcategoryId = useMemo(() => {
    if (!subcategorySlug) return undefined;
    return allCategories.find((c) => c.slug === subcategorySlug)?._id;
  }, [allCategories, subcategorySlug]);

  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<ProductParent[]>([]);

  // Reset al cambiar filtros
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [
    search,
    categorySlug,
    subcategorySlug,
    brandsParam,
    onSale,
    featured,
    collectionSlug,
    sort,
  ]);

  const { data, isFetching } = useProducts({
    search,
    category: categoryId,
    subcategory: subcategoryId,
    brands: brands.length > 0 ? brands : undefined,
    onSale,
    featured,
    collection: collectionSlug,
    page,
    limit: PAGE_SIZE,
    sort,
  });

  // Facetas dinámicas — cascada unidireccional: solo category/search/collection
  const { data: facets, isLoading: facetsLoading } = useFacets({
    category: categoryId,
    search,
    collection: collectionSlug,
  });

  const products: ProductParent[] = data?.data || [];
  const pagination = data?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  useEffect(() => {
    if (page === 1) {
      setAccumulated(products);
    } else if (products.length > 0) {
      setAccumulated((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [...prev, ...products.filter((p) => !seen.has(p._id))];
      });
    }
  }, [products, page]);

  // Lazy loading via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isFetching) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const setParam = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    }
    router.replace(`/m/productos${params.toString() ? `?${params.toString()}` : ''}`, {
      scroll: false,
    });
  };

  const { data: activeCollection } = useCollection(collectionSlug || '', 'slug');

  const chips = [
    search && { key: 'search', label: `"${search}"`, onRemove: () => setParam({ search: undefined }) },
    collectionSlug && {
      key: 'col',
      label: `${activeCollection?.emoji ? activeCollection.emoji + ' ' : '🎀 '}${activeCollection?.name || collectionSlug}`,
      onRemove: () => setParam({ coleccion: undefined }),
    },
    categorySlug && {
      key: 'cat',
      label: allCategories.find((c) => c.slug === categorySlug)?.name.replace(/^Categoria-\d+-/, '') || categorySlug,
      onRemove: () => setParam({ categoria: undefined, subcategoria: undefined }),
    },
    subcategorySlug && {
      key: 'subcat',
      label: allCategories.find((c) => c.slug === subcategorySlug)?.name.replace(/^Subcat-\w+-/, '') || subcategorySlug,
      onRemove: () => setParam({ subcategoria: undefined }),
    },
    onSale && { key: 'sale', label: 'En oferta', onRemove: () => setParam({ onSale: undefined }) },
    featured && { key: 'featured', label: 'Destacados', onRemove: () => setParam({ featured: undefined }) },
    ...brands.map((b) => ({
      key: `brand-${b}`,
      label: allBrands.find((br) => br._id === b)?.name || 'Marca',
      onRemove: () => setParam({ brands: brands.filter((x) => x !== b).join(',') || undefined }),
    })),
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[];

  return (
    <>
      <CategoryChips activeSlug={categorySlug} />

      <FilterChipsBar
        chips={chips}
        onClearAll={() => router.replace('/m/productos')}
      />

      {/* Toolbar — orden + filtros con identidad Quelita */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <p className="text-xs font-medium text-muted-foreground">
          {pagination?.total ? (
            <>
              <span className="font-bold text-foreground tabular-nums">
                {pagination.total}
              </span>{' '}
              {pagination.total === 1 ? 'producto' : 'productos'}
            </>
          ) : (
            <>&nbsp;</>
          )}
        </p>

        <div className="ml-auto flex items-center gap-2">
          {/* Botón ORDEN */}
          <Sheet>
            <SheetTrigger asChild>
              {(() => {
                const current = SORTS.find((s) => s.value === sort) || SORTS[0];
                const SortIcon = current.icon;
                const isCustom = sort !== 'newest';
                return (
                  <button
                    type="button"
                    className={cn(
                      'tappable group inline-flex h-10 items-center gap-1.5 rounded-full pl-1.5 pr-3.5 text-xs font-bold transition-all active:scale-95',
                      isCustom
                        ? 'bg-gradient-to-br text-white shadow-md shadow-primary/30 ' + current.gradient
                        : 'border border-border bg-card text-foreground shadow-sm hover:border-primary/40 hover:shadow-md'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-7 w-7 place-items-center rounded-full transition-transform group-hover:rotate-12',
                        isCustom
                          ? 'bg-white/25 text-white backdrop-blur'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      <SortIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="hidden sm:inline">{current.short}</span>
                    <span className="sm:hidden">Orden</span>
                  </button>
                );
              })()}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl border-t-0 p-0">
              {/* Header con personalidad */}
              <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary via-primary/90 to-secondary px-5 pb-5 pt-6 text-primary-foreground">
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-accent/30 blur-2xl" aria-hidden />
                <SheetHeader className="relative z-10 space-y-1 text-left">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/30">
                      <ArrowDownAZ className="h-5 w-5" />
                    </span>
                    <div>
                      <SheetTitle className="font-display text-lg font-bold text-white">
                        Ordenar productos
                      </SheetTitle>
                      <p className="text-[11px] text-white/75">
                        Encontrá lo dulce más rápido 🍡
                      </p>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              <div className="flex flex-col gap-1.5 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {SORTS.map((s) => {
                  const active = sort === s.value;
                  const Icon = s.icon;
                  return (
                    <SheetClose asChild key={s.value}>
                      <button
                        type="button"
                        onClick={() =>
                          setParam({ sort: s.value === 'newest' ? undefined : s.value })
                        }
                        className={cn(
                          'tappable group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.98]',
                          active
                            ? 'border-primary/40 bg-primary/5 shadow-sm'
                            : 'border-transparent hover:bg-muted/60'
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-110',
                            s.gradient
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold leading-tight">
                            <span className="mr-1" aria-hidden>
                              {s.emoji}
                            </span>
                            {s.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{s.short}</p>
                        </div>
                        {active && (
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    </SheetClose>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* Botón FILTROS */}
          <Sheet>
            <SheetTrigger asChild>
              {(() => {
                const activeFiltersCount =
                  (onSale ? 1 : 0) +
                  (featured ? 1 : 0) +
                  (subcategorySlug ? 1 : 0) +
                  (collectionSlug ? 1 : 0) +
                  brands.length;
                const hasActive = activeFiltersCount > 0;
                return (
                  <button
                    type="button"
                    className={cn(
                      'tappable group relative inline-flex h-10 items-center gap-1.5 rounded-full pl-1.5 pr-3.5 text-xs font-bold transition-all active:scale-95',
                      hasActive
                        ? 'bg-gradient-to-br from-accent via-accent to-fuchsia-500 text-accent-foreground shadow-md shadow-accent/30'
                        : 'border border-border bg-card text-foreground shadow-sm hover:border-accent/40 hover:shadow-md'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-7 w-7 place-items-center rounded-full transition-transform group-hover:rotate-12',
                        hasActive
                          ? 'bg-white/25 text-white backdrop-blur'
                          : 'bg-accent/10 text-accent'
                      )}
                    >
                      <Sliders className="h-3.5 w-3.5" />
                    </span>
                    Filtros
                    {hasActive && (
                      <span className="ml-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1 text-[11px] font-black text-accent shadow-sm">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                );
              })()}
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-t-0 p-0"
            >
              {/* Header con personalidad */}
              <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-accent via-fuchsia-500 to-purple-500 px-5 pb-5 pt-6 text-white">
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary/30 blur-2xl" aria-hidden />
                <SheetHeader className="relative z-10 space-y-1 text-left">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/30">
                      <Sliders className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <SheetTitle className="font-display text-lg font-bold text-white">
                        Filtrar selección
                      </SheetTitle>
                      <p className="text-[11px] text-white/80">
                        Refiná tu búsqueda dulce 🎀
                      </p>
                    </div>
                    {(onSale ||
                      featured ||
                      brands.length > 0 ||
                      subcategorySlug) && (
                      <button
                        type="button"
                        onClick={() => {
                          setParam({
                            onSale: undefined,
                            featured: undefined,
                            brands: undefined,
                            subcategoria: undefined,
                          });
                        }}
                        className="tappable rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold backdrop-blur hover:bg-white/30"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </SheetHeader>
              </div>

              <div className="space-y-6 px-5 py-5">
                {/* Promociones — counts dinámicos */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-100 text-orange-600">
                      <Flame className="h-4 w-4" />
                    </span>
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                      Promociones
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const onSaleCount = facets?.promos?.onSale ?? 0;
                      const disabled = !facetsLoading && onSaleCount === 0;
                      return (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            setParam({ onSale: onSale ? undefined : 'true' })
                          }
                          className={cn(
                            'tappable group flex items-center gap-2 rounded-2xl border-2 p-3 text-left transition-all active:scale-95',
                            disabled && 'opacity-40 grayscale cursor-not-allowed',
                            onSale
                              ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-sm'
                              : 'border-border bg-card hover:border-orange-300'
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br shadow-sm transition-transform group-hover:scale-110',
                              onSale
                                ? 'from-orange-400 to-red-500 text-white'
                                : 'from-orange-100 to-red-100 text-orange-500'
                            )}
                          >
                            <Flame className="h-4 w-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight">En oferta</p>
                            <p className="text-[10px] text-muted-foreground">
                              {facetsLoading
                                ? '...'
                                : `${onSaleCount} ${onSaleCount === 1 ? 'producto' : 'productos'}`}
                            </p>
                          </div>
                          {onSale && (
                            <Check
                              className="h-4 w-4 shrink-0 text-orange-500"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })()}

                    {(() => {
                      const featuredCount = facets?.promos?.featured ?? 0;
                      const disabled = !facetsLoading && featuredCount === 0;
                      return (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            setParam({ featured: featured ? undefined : 'true' })
                          }
                          className={cn(
                            'tappable group flex items-center gap-2 rounded-2xl border-2 p-3 text-left transition-all active:scale-95',
                            disabled && 'opacity-40 grayscale cursor-not-allowed',
                            featured
                              ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm'
                              : 'border-border bg-card hover:border-amber-300'
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br shadow-sm transition-transform group-hover:scale-110',
                              featured
                                ? 'from-amber-400 to-yellow-500 text-white'
                                : 'from-amber-100 to-yellow-100 text-amber-500'
                            )}
                          >
                            <Star className="h-4 w-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight">Destacados</p>
                            <p className="text-[10px] text-muted-foreground">
                              {facetsLoading
                                ? '...'
                                : `${featuredCount} ${featuredCount === 1 ? 'producto' : 'productos'}`}
                            </p>
                          </div>
                          {featured && (
                            <Check
                              className="h-4 w-4 shrink-0 text-amber-500"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </section>

                {/* Subcategorías — solo si hay categoría activa y facets > 0 */}
                {categorySlug && facets?.subcategories && facets.subcategories.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary/10 text-secondary">
                          <Layers className="h-4 w-4" />
                        </span>
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                          Subcategorías
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {facets.subcategories.map((sc) => {
                        const checked = subcategorySlug === sc.slug;
                        return (
                          <button
                            key={sc._id}
                            type="button"
                            onClick={() =>
                              setParam({
                                subcategoria: checked ? undefined : sc.slug,
                              })
                            }
                            className={cn(
                              'tappable inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                              checked
                                ? 'border-secondary bg-secondary text-secondary-foreground shadow-md shadow-secondary/20'
                                : 'border-border bg-card hover:border-secondary/40'
                            )}
                          >
                            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                            {sc.name.replace(/^Subcat-\w+-/, '')}
                            <span
                              className={cn(
                                'tabular-nums',
                                checked
                                  ? 'opacity-80'
                                  : 'text-muted-foreground'
                              )}
                            >
                              · {sc.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Marcas — facetas dinámicas con counts */}
                {facetsLoading ? (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Tag className="h-4 w-4" />
                      </span>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                        Marcas
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-8 w-20 animate-pulse rounded-full bg-muted"
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  facets?.brands &&
                  facets.brands.length > 0 && (
                    <section>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Tag className="h-4 w-4" />
                          </span>
                          <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                            Marcas
                          </h3>
                        </div>
                        {brands.length > 0 && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {brands.length} elegidas
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {facets.brands.map((b) => {
                          const checked = brands.includes(b._id);
                          return (
                            <button
                              key={b._id}
                              type="button"
                              onClick={() => {
                                const next = checked
                                  ? brands.filter((x) => x !== b._id)
                                  : [...brands, b._id];
                                setParam({
                                  brands: next.length ? next.join(',') : undefined,
                                });
                              }}
                              className={cn(
                                'tappable inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                                checked
                                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                  : 'border-border bg-card hover:border-primary/40'
                              )}
                            >
                              {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                              {b.name}
                              <span
                                className={cn(
                                  'tabular-nums',
                                  checked ? 'opacity-80' : 'text-muted-foreground'
                                )}
                              >
                                · {b.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )
                )}

                {/* Colecciones — facetas dinámicas */}
                {facets?.collections && facets.collections.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Package className="h-4 w-4" />
                      </span>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                        Colecciones
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {facets.collections.map((c) => {
                        const checked = collectionSlug === c.slug;
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() =>
                              setParam({
                                coleccion: checked ? undefined : c.slug,
                              })
                            }
                            className={cn(
                              'tappable inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                              checked
                                ? 'border-accent bg-accent text-accent-foreground shadow-md shadow-accent/20'
                                : 'border-border bg-card hover:border-accent/40'
                            )}
                          >
                            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                            {c.name}
                            <span
                              className={cn(
                                'tabular-nums',
                                checked ? 'opacity-80' : 'text-muted-foreground'
                              )}
                            >
                              · {c.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Empty state — sin facetas para esta categoría */}
                {!facetsLoading &&
                  facets &&
                  facets.brands.length === 0 &&
                  facets.collections.length === 0 &&
                  (!categorySlug || facets.subcategories.length === 0) && (
                    <section className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        No hay filtros adicionales disponibles para esta búsqueda. Probá ampliar la categoría o limpiar la búsqueda.
                      </p>
                    </section>
                  )}

                <SheetClose asChild>
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-gradient-to-r from-primary via-primary to-secondary text-base font-bold shadow-lg shadow-primary/30 hover:shadow-xl active:scale-[0.98]"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Mostrar resultados
                    {pagination?.total ? (
                      <span className="ml-2 rounded-full bg-white/25 px-2.5 py-0.5 text-xs backdrop-blur">
                        {pagination.total}
                      </span>
                    ) : null}
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ProductGridM products={accumulated} isLoading={isFetching && page === 1} />

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isFetching && (
            <span className="text-xs text-muted-foreground">Cargando más…</span>
          )}
        </div>
      )}
    </>
  );
}

export default function MCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[260px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
