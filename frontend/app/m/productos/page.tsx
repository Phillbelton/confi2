'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
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
import { useProducts, useFacets } from '@/hooks/useProducts';
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
    router.replace(`/m/productos?${params.toString()}`);
  };

  const productQuery: ProductQueryParams = {
    category,
    subcategory,
    brands,
    format,
    flavor,
    collection,
    onSale: onSale || undefined,
    featured: featured || undefined,
    search: debouncedSearch || undefined,
    sort,
    limit: 30,
    // Filtros dinámicos attr_<key> — el backend los acepta como query
    // strings adicionales aunque no estén en el tipo formal.
    ...(attrQueryEntries as Partial<ProductQueryParams>),
  };
  const { data, isLoading } = useProducts(productQuery);

  const products = data?.data || [];
  const total = data?.pagination?.total || 0;

  const { data: facets } = useFacets({
    category, search: debouncedSearch, collection,
    ...attrQueryEntries,
  });

  // Derivar arrays de facets con identidades estables (no `undefined`)
  // para usar directamente en condiciones y renders sin chaining repetido.
  const facetSubcategories = facets?.subcategories ?? [];
  const facetBrands = facets?.brands ?? [];
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

  const activeFilterCount =
    activeChips.length + (onSale ? 1 : 0) + (featured ? 1 : 0);

  const clearFilters = () => {
    const updates: Record<string, string | undefined> = {
      brands: undefined,
      subcategoria: undefined,
      formato: undefined,
      sabor: undefined,
      onSale: undefined,
      featured: undefined,
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

  return (
    <>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="border-b border-border/60 bg-muted/30 lg:px-4" />
      )}

      {/* Subcategorías de la categoría actual */}
      {category && facetSubcategories.length > 0 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-border/60 bg-background px-4 py-2.5 lg:px-8">
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

      {/* Buscador */}
      <div className="px-4 pt-3 lg:px-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setParam({ search: e.target.value || undefined });
            }}
            className="h-11 rounded-full pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setParam({ search: undefined }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controles: resultados · orden · filtros */}
      <div className="flex items-center gap-2 px-4 py-3 lg:px-8">
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
              <Button variant="outline" className="h-9 gap-1.5 rounded-full px-3.5">
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

              <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
                {facetBrands.length > 0 && (
                  <FilterSection
                    title="Marcas"
                    items={facetBrands}
                    selected={brands ? brands.split(',') : []}
                    onToggle={(slug) => {
                      const cur = brands ? brands.split(',') : [];
                      const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
                      setParam({ brands: next.length ? next.join(',') : undefined });
                    }}
                  />
                )}

                {facetSubcategories.length > 0 && (
                  <FilterSection
                    title="Subcategorías"
                    items={facetSubcategories}
                    selected={subcategory ? [subcategory] : []}
                    onToggle={(slug) =>
                      setParam({ subcategoria: subcategory === slug ? undefined : slug })
                    }
                  />
                )}

                {facetFormats.length > 0 && (
                  <FilterSection
                    title="Formato"
                    items={facetFormats.map((f) => ({ ...f, name: f.label ?? f.name ?? f.slug }))}
                    selected={format ? [format] : []}
                    onToggle={(slug) =>
                      setParam({ formato: format === slug ? undefined : slug })
                    }
                  />
                )}

                {facetFlavors.length > 0 && (
                  <FilterSection
                    title="Sabor"
                    items={facetFlavors.map((f) => ({ ...f, name: f.name ?? f.label ?? f.slug }))}
                    selected={flavor ? [flavor] : []}
                    onToggle={(slug) =>
                      setParam({ sabor: flavor === slug ? undefined : slug })
                    }
                  />
                )}

                {dynamicAttributes.map((attr) => (
                  <div key={attr.key}>
                    <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {attr.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {attr.options.map((opt) => {
                        const sel = (activeAttrs[attr.key] || []).includes(opt.value);
                        return (
                          <FilterChip
                            key={opt.value}
                            label={`${opt.label} · ${opt.count}`}
                            selected={sel}
                            onClick={() => toggleAttrValue(attr.key, opt.value, attr.multiSelect)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div>
                  <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Promociones
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label={`En oferta (${facets?.promos?.onSale || 0})`}
                      selected={onSale}
                      onClick={() => setParam({ onSale: onSale ? undefined : 'true' })}
                    />
                    <FilterChip
                      label={`Destacados (${facets?.promos?.featured || 0})`}
                      selected={featured}
                      onClick={() => setParam({ featured: featured ? undefined : 'true' })}
                    />
                  </div>
                </div>
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
        <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto px-4 pb-3 lg:px-8">
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

      <ProductGridM products={products} isLoading={isLoading} className="pb-12" />
    </>
  );
}

function FilterSection({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: Array<{ _id: string; name?: string; label?: string; slug: string; count: number }>;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <FilterChip
            key={it._id}
            label={`${it.name || it.label} · ${it.count}`}
            selected={selected.includes(it.slug)}
            onClick={() => onToggle(it.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card hover:border-primary/40'
      )}
    >
      {label}
    </button>
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
