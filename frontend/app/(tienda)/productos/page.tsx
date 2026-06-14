'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Search, X, SlidersHorizontal } from 'lucide-react';
import { ProductGridM } from '@/components/m/catalog/ProductGridM';
import { Breadcrumbs } from '@/components/m/detail/Breadcrumbs';
import { useCatalogBreadcrumbs } from '@/hooks/useCatalogBreadcrumbs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useInfiniteProducts, useFacets } from '@/hooks/useProducts';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';
import type { ProductQueryParams } from '@/services/products';

// Valida que el sort venga de la URL en el conjunto soportado por la
// API. Devuelve undefined si no coincide → la API usa el default.
const VALID_SORTS = [
  'price_asc', 'price_desc', 'name_asc', 'name_desc',
  'newest', 'oldest', 'popular',
] as const;
type SortKey = (typeof VALID_SORTS)[number];
function parseSort(raw: string | null): SortKey | undefined {
  return raw && (VALID_SORTS as readonly string[]).includes(raw)
    ? (raw as SortKey)
    : undefined;
}

// Cuántas opciones muestra cada sección de filtros antes del "Ver más".
const FACET_VISIBLE_LIMIT = 10;

// Rangos de precio fijos en CLP. El catálogo va de ~$10 a $20.000, con la
// mayoría entre $1.000 y $5.000, así que estos tramos cubren bien sin
// depender de mín/máx dinámicos del backend.
type PriceRange = { label: string; min?: number; max?: number };
const PRICE_RANGES: PriceRange[] = [
  { label: 'Hasta $1.000', max: 1000 },
  { label: '$1.000 – $3.000', min: 1000, max: 3000 },
  { label: '$3.000 – $5.000', min: 3000, max: 5000 },
  { label: 'Más de $5.000', min: 5000 },
];

function CatalogContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const category = sp.get('categoria') || undefined;
  const subcategory = sp.get('subcategoria') || undefined;
  const brands = sp.get('brands') || undefined;
  const format = sp.get('formato') || undefined;
  const flavor = sp.get('sabor') || undefined;
  const collection = sp.get('coleccion') || undefined;
  const onSale = sp.get('onSale') === 'true';
  const featured = sp.get('featured') === 'true';
  const minPrice = sp.get('minPrice') || undefined;
  const maxPrice = sp.get('maxPrice') || undefined;
  const search = sp.get('search') || '';
  const sort: SortKey = parseSort(sp.get('sort')) ?? 'newest';

  // Filtros dinámicos `attr_<key>=v1,v2` en URL
  const activeAttrs: Record<string, string[]> = {};
  sp.forEach((value, key) => {
    if (key.startsWith('attr_') && value) {
      activeAttrs[key.slice(5)] = value.split(',').filter(Boolean);
    }
  });
  const attrQueryEntries = Object.entries(activeAttrs).reduce<Record<string, string>>(
    (acc, [k, v]) => {
      acc[`attr_${k}`] = v.join(',');
      return acc;
    },
    {}
  );

  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch] = useDebounce(searchInput, 350);

  const setParam = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === '') params.delete(k);
      else params.set(k, v);
    }
    router.replace(`/productos?${params.toString()}`);
  };

  // La query/facets ya usan `debouncedSearch`; la URL también se escribe
  // recién con el valor estable para no hacer router.replace por tecla.
  useEffect(() => {
    if (debouncedSearch !== search) {
      setParam({ search: debouncedSearch || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const productQuery: ProductQueryParams = {
    category,
    subcategory,
    brands,
    format,
    flavor,
    collection,
    onSale: onSale || undefined,
    featured: featured || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    // La URL es la fuente de verdad de la búsqueda: el input in-page la
    // escribe con debounce y el buscador del header la setea directo.
    search: search || undefined,
    sort,
    limit: 30,
    // Filtros dinámicos attr_<key> — el backend los acepta como query
    // strings adicionales aunque no estén en el tipo formal.
    ...(attrQueryEntries as Partial<ProductQueryParams>),
  };
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(productQuery);

  const products = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination?.total ?? 0;

  // Infinite scroll: el centinela al pie de la grilla dispara la página
  // siguiente; el botón "Cargar más" queda como respaldo accesible.
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: facets } = useFacets({
    category, search: debouncedSearch, collection,
    ...attrQueryEntries,
  });

  // Derivar arrays de facets con identidades estables (no `undefined`)
  // para usar directamente en condiciones y renders sin chaining repetido.
  const facetSubcategories = facets?.subcategories ?? [];
  const facetBrands = facets?.brands ?? [];
  // El backend ya devuelve los formatos por conteo (más productos primero),
  // que es el orden más útil para el top visible antes del "Ver más".
  const facetFormats = facets?.formats ?? [];
  const facetFlavors = facets?.flavors ?? [];
  const dynamicAttributes = facets?.attributes ?? [];

  const toggleAttrValue = (key: string, value: string, multi: boolean) => {
    const cur = activeAttrs[key] || [];
    let next: string[];
    if (multi) {
      next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    } else {
      next = cur.includes(value) ? [] : [value];
    }
    setParam({ [`attr_${key}`]: next.length ? next.join(',') : undefined });
  };

  // Rango de precio activo (single-select): comparamos min/max de la URL
  // con cada tramo. Re-clic sobre el activo lo limpia.
  const isPriceRangeActive = (r: PriceRange) =>
    (r.min?.toString() ?? '') === (minPrice ?? '') &&
    (r.max?.toString() ?? '') === (maxPrice ?? '');
  const togglePriceRange = (r: PriceRange) =>
    setParam(
      isPriceRangeActive(r)
        ? { minPrice: undefined, maxPrice: undefined }
        : { minPrice: r.min?.toString(), maxPrice: r.max?.toString() }
    );

  // Chips activos visibles bajo el breadcrumb
  const activeChips: Array<{ label: string; onRemove: () => void }> = [];
  if (brands) {
    brands.split(',').forEach((b) => {
      const match = facetBrands.find((x) => x.slug === b);
      activeChips.push({
        label: `Marca: ${match?.name || b}`,
        onRemove: () => {
          const next = brands.split(',').filter((s) => s !== b);
          setParam({ brands: next.length ? next.join(',') : undefined });
        },
      });
    });
  }
  if (subcategory) {
    const match = facetSubcategories.find((x) => x.slug === subcategory);
    activeChips.push({
      label: `${match?.name || subcategory}`,
      onRemove: () => setParam({ subcategoria: undefined }),
    });
  }
  if (format) {
    const match = facetFormats.find((x) => x.slug === format);
    activeChips.push({
      label: `${match?.label || format}`,
      onRemove: () => setParam({ formato: undefined }),
    });
  }
  if (flavor) {
    const match = facetFlavors.find((x) => x.slug === flavor);
    activeChips.push({
      label: `${match?.name || flavor}`,
      onRemove: () => setParam({ sabor: undefined }),
    });
  }
  for (const [key, values] of Object.entries(activeAttrs)) {
    const attrDef = dynamicAttributes.find((a) => a.key === key);
    for (const v of values) {
      const optMatch = attrDef?.options.find((o) => o.value === v);
      activeChips.push({
        label: `${attrDef?.label || key}: ${optMatch?.label || v}`,
        onRemove: () => toggleAttrValue(key, v, true),
      });
    }
  }
  if (onSale) {
    activeChips.push({
      label: 'En oferta',
      onRemove: () => setParam({ onSale: undefined }),
    });
  }
  if (featured) {
    activeChips.push({
      label: 'Destacados',
      onRemove: () => setParam({ featured: undefined }),
    });
  }
  if (minPrice || maxPrice) {
    const activeRange = PRICE_RANGES.find(isPriceRangeActive);
    activeChips.push({
      label: `Precio: ${activeRange?.label ?? `$${minPrice ?? '0'}–$${maxPrice ?? '∞'}`}`,
      onRemove: () => setParam({ minPrice: undefined, maxPrice: undefined }),
    });
  }

  const activeFilterCount = activeChips.length;

  const clearFilters = () => {
    const updates: Record<string, string | undefined> = {
      brands: undefined,
      subcategoria: undefined,
      formato: undefined,
      sabor: undefined,
      onSale: undefined,
      featured: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    };
    for (const k of Object.keys(activeAttrs)) {
      updates[`attr_${k}`] = undefined;
    }
    setParam(updates);
  };

  const breadcrumbs = useCatalogBreadcrumbs({
    categorySlug: category,
    subcategorySlug: subcategory,
    collectionSlug: collection,
  });

  // Secciones de filtros compartidas entre el sheet (mobile) y el sidebar
  // sticky (desktop). Misma UI (listas verticales), dos contenedores; nunca
  // visibles a la vez. Orden por utilidad: contexto, precio, luego facets.
  const promoOptions = [
    { value: 'onSale', label: 'En oferta', count: facets?.promos?.onSale ?? 0 },
    { value: 'featured', label: 'Destacados', count: facets?.promos?.featured ?? 0 },
  ].filter((o) => o.count > 0 || (o.value === 'onSale' ? onSale : featured));

  const renderFilters = () => (
    <>
      {/* Subcategorías: solo con una categoría activa (en la raíz son ruido). */}
      {category && facetSubcategories.length > 0 && (
        <FilterList
          title="Subcategorías"
          options={facetSubcategories.map((s) => ({ value: s.slug, label: s.name, count: s.count }))}
          selected={subcategory ? [subcategory] : []}
          multi={false}
          onToggle={(slug) =>
            setParam({ subcategoria: subcategory === slug ? undefined : slug })
          }
        />
      )}

      <FilterList
        title="Precio"
        options={PRICE_RANGES.map((r) => ({ value: r.label, label: r.label }))}
        selected={PRICE_RANGES.filter(isPriceRangeActive).map((r) => r.label)}
        multi={false}
        onToggle={(label) => {
          const r = PRICE_RANGES.find((x) => x.label === label);
          if (r) togglePriceRange(r);
        }}
      />

      {facetBrands.length > 0 && (
        <FilterList
          title="Marcas"
          options={facetBrands.map((b) => ({ value: b.slug, label: b.name, count: b.count }))}
          selected={brands ? brands.split(',') : []}
          multi
          searchable
          onToggle={(slug) => {
            const cur = brands ? brands.split(',') : [];
            const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
            setParam({ brands: next.length ? next.join(',') : undefined });
          }}
        />
      )}

      {facetFormats.length > 0 && (
        <FilterList
          title="Formato"
          options={facetFormats.map((f) => ({ value: f.slug, label: f.label ?? f.name ?? f.slug, count: f.count }))}
          selected={format ? [format] : []}
          multi={false}
          searchable
          onToggle={(slug) =>
            setParam({ formato: format === slug ? undefined : slug })
          }
        />
      )}

      {facetFlavors.length > 0 && (
        <FilterList
          title="Sabor"
          options={facetFlavors.map((f) => ({ value: f.slug, label: f.name ?? f.label ?? f.slug, count: f.count }))}
          selected={flavor ? [flavor] : []}
          multi={false}
          searchable
          onToggle={(slug) =>
            setParam({ sabor: flavor === slug ? undefined : slug })
          }
        />
      )}

      {dynamicAttributes.map((attr) => (
        <FilterList
          key={attr.key}
          title={attr.label}
          options={attr.options.map((o) => ({ value: o.value, label: o.label, count: o.count }))}
          selected={activeAttrs[attr.key] || []}
          multi={attr.multiSelect}
          onToggle={(value) => toggleAttrValue(attr.key, value, attr.multiSelect)}
        />
      ))}

      {promoOptions.length > 0 && (
        <FilterList
          title="Promociones"
          options={promoOptions}
          selected={[...(onSale ? ['onSale'] : []), ...(featured ? ['featured'] : [])]}
          multi
          onToggle={(value) => {
            if (value === 'onSale') setParam({ onSale: onSale ? undefined : 'true' });
            else setParam({ featured: featured ? undefined : 'true' });
          }}
        />
      )}
    </>
  );

  return (
    <>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="border-b border-border/60 bg-muted/30 lg:px-4" />
      )}

      {/* Subcategorías de la categoría actual — fila horizontal solo en
          mobile/tablet; en desktop viven en el sidebar de filtros. */}
      {category && facetSubcategories.length > 0 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-border/60 bg-background px-4 py-2.5 lg:hidden">
          <SubcategoryChip
            label="Todo"
            active={!subcategory}
            onClick={() => setParam({ subcategoria: undefined })}
          />
          {facetSubcategories.map((s) => (
            <SubcategoryChip
              key={s._id}
              label={s.name}
              count={s.count}
              active={subcategory === s.slug}
              onClick={() =>
                setParam({
                  subcategoria: subcategory === s.slug ? undefined : s.slug,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Layout: en desktop, sidebar de filtros sticky + columna de resultados;
          en mobile, todo apilado y los filtros viven en el sheet. */}
      <div className="lg:flex lg:gap-6 lg:px-8 lg:pt-4">
        {/* Sidebar de filtros — solo desktop */}
        <aside className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:w-60 lg:shrink-0 lg:self-start lg:overflow-y-auto">
          <div className="sticky top-0 z-10 mb-1 flex items-center justify-between border-b border-border/60 bg-background py-2">
            <h2 className="text-sm font-bold uppercase tracking-wide">Filtros</h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Limpiar todo
              </button>
            )}
          </div>
          <div className="pb-8 pt-1">{renderFilters()}</div>
        </aside>

        {/* Columna de resultados */}
        <div className="min-w-0 lg:flex-1">
      {/* Título de página */}
      <div className="px-4 pt-4 lg:px-0 lg:pt-0">
        <h1 className="text-xl font-extrabold tracking-tight lg:text-2xl">
          Catálogo
        </h1>
      </div>

      {/* Buscador — en desktop ya existe el buscador prominente del header,
          así que acá se muestra solo en mobile/tablet para no duplicarlo. */}
      <div className="px-4 pt-3 lg:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-11 rounded-full pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controles: resultados · orden · filtros */}
      <div className="flex items-center gap-2 px-4 py-3 lg:px-0">
        <p className="text-xs font-medium text-muted-foreground">
          {isLoading ? 'Cargando…' : `${total} producto${total === 1 ? '' : 's'}`}
        </p>

        <div className="ml-auto flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setParam({ sort: v === 'newest' ? undefined : v })}>
            <SelectTrigger className="h-9 w-[140px] rounded-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más nuevos</SelectItem>
              <SelectItem value="price_asc">Precio: menor</SelectItem>
              <SelectItem value="price_desc">Precio: mayor</SelectItem>
              <SelectItem value="name_asc">Nombre A-Z</SelectItem>
              <SelectItem value="popular">Populares</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-9 gap-1.5 rounded-full px-3.5 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-xs font-semibold">Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="flex w-full max-w-md flex-col gap-0 p-0"
            >
              <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b px-4 py-3.5">
                <SheetTitle className="text-base font-bold">Filtros</SheetTitle>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Limpiar todo
                  </button>
                )}
                <SheetClose
                  aria-label="Cerrar filtros"
                  className="ml-auto grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </SheetClose>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {renderFilters()}
              </div>

              <div className="border-t bg-background p-3">
                <SheetClose asChild>
                  <Button className="h-11 w-full rounded-full text-sm font-bold">
                    Ver {total} producto{total === 1 ? '' : 's'}
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filtros activos */}
      {activeChips.length > 0 && (
        <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto px-4 pb-3 lg:px-0">
          {activeChips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 whitespace-nowrap px-2 py-1 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}

      <ProductGridM
        products={products}
        isLoading={isLoading}
        className={cn('lg:px-0', !hasNextPage && 'pb-12')}
      />

      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center gap-2 px-4 py-6 pb-12"
        >
          <p className="text-xs text-muted-foreground">
            Mostrando {products.length} de {total} productos
          </p>
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="h-11 rounded-full px-8 text-sm font-bold"
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar más productos'}
          </Button>
        </div>
      )}
        </div>
      </div>
    </>
  );
}

/**
 * Colapsa una lista de chips a FACET_VISIBLE_LIMIT visibles. Los
 * seleccionados más allá del límite se muestran igual para que nunca
 * quede un filtro activo oculto.
 */
function useChipCollapse<T>(items: T[], isSelected: (item: T) => boolean) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded
    ? items
    : [
        ...items.slice(0, FACET_VISIBLE_LIMIT),
        ...items.slice(FACET_VISIBLE_LIMIT).filter(isSelected),
      ];
  return {
    visible,
    expanded,
    toggle: () => setExpanded((e) => !e),
    collapsible: items.length > FACET_VISIBLE_LIMIT,
    moreCount: items.length - visible.length,
  };
}

function ShowMoreButton({
  expanded, moreCount, onClick,
}: { expanded: boolean; moreCount: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
    >
      {expanded ? 'Ver menos' : `Ver más (${moreCount})`}
    </button>
  );
}

/** Encabezado de sección unificado + divisor + badge de seleccionados. */
function FilterGroup({
  title, selectedCount, children,
}: { title: string; selectedCount: number; children: ReactNode }) {
  return (
    <div className="border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span>{title}</span>
        {selectedCount > 0 && (
          <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {selectedCount}
          </span>
        )}
      </h3>
      {children}
    </div>
  );
}

/** Una fila de opción: checkbox (multi) o radio (single) + label + conteo. */
function FilterOption({
  label, count, selected, multi, onToggle,
}: { label: string; count?: number; selected: boolean; multi: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-muted/60"
    >
      <span
        className={cn(
          'grid h-[18px] w-[18px] shrink-0 place-items-center border-2 transition-colors',
          multi ? 'rounded' : 'rounded-full',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/35'
        )}
      >
        {selected &&
          (multi ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : (
            <span className="h-2 w-2 rounded-full bg-current" />
          ))}
      </span>
      <span className={cn('min-w-0 flex-1 truncate', selected && 'font-semibold')}>
        {label}
      </span>
      {typeof count === 'number' && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

/**
 * Lista de opciones de un filtro como columna vertical (checkbox/radio).
 * Colapsa a FACET_VISIBLE_LIMIT con "Ver más" y, si `searchable`, ofrece un
 * buscador interno cuando hay muchas opciones.
 */
function FilterList({
  title, options, selected, multi, onToggle, searchable,
}: {
  title: string;
  options: Array<{ value: string; label: string; count?: number }>;
  selected: string[];
  multi: boolean;
  onToggle: (value: string) => void;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState('');
  const showSearch = !!searchable && options.length > 12;
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const collapse = useChipCollapse(filtered, (o) => selected.includes(o.value));
  const visible = query ? filtered : collapse.visible;

  return (
    <FilterGroup title={title} selectedCount={selected.length}>
      {showSearch && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar ${title.toLowerCase()}…`}
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs outline-none transition-colors focus:border-primary/50"
          />
        </div>
      )}
      <div className="space-y-0.5">
        {visible.map((o) => (
          <FilterOption
            key={o.value}
            label={o.label}
            count={o.count}
            selected={selected.includes(o.value)}
            multi={multi}
            onToggle={() => onToggle(o.value)}
          />
        ))}
        {visible.length === 0 && (
          <p className="px-1.5 py-1 text-xs text-muted-foreground">Sin resultados</p>
        )}
      </div>
      {!query && collapse.collapsible && (
        <ShowMoreButton
          expanded={collapse.expanded}
          moreCount={collapse.moreCount}
          onClick={collapse.toggle}
        />
      )}
    </FilterGroup>
  );
}

/** Chip de subcategoría — fila horizontal scrollable bajo el breadcrumb. */
function SubcategoryChip({
  label, count, active, onClick,
}: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'border-border bg-card text-foreground hover:border-primary/40'
      )}
    >
      {label}
      {typeof count === 'number' && (
        <span
          className={cn(
            'text-[10px] font-bold',
            active ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-muted-foreground">Cargando…</div>}>
      <CatalogContent />
    </Suspense>
  );
}
