'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { CategoryChips } from '@/components/m/shell/CategoryChips';
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
  const sort = sp.get('sort') || 'newest';

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

  const { data, isLoading } = useProducts({
    category,
    subcategory,
    brands,
    format,
    flavor,
    collection,
    onSale: onSale || undefined,
    featured: featured || undefined,
    search: debouncedSearch || undefined,
    sort: sort as any,
    limit: 30,
    ...attrQueryEntries,
  } as any);

  const products = data?.data || [];
  const total = data?.pagination?.total || 0;

  const { data: facets } = useFacets({
    category, search: debouncedSearch, collection,
    ...attrQueryEntries,
  });

  const dynamicAttributes: Array<{
    key: string;
    label: string;
    multiSelect: boolean;
    options: Array<{ value: string; label: string; count: number }>;
  }> = facets?.attributes || [];

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
      const match = facets?.brands?.find((x: any) => x.slug === b);
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
    const match = facets?.subcategories?.find((x: any) => x.slug === subcategory);
    activeChips.push({
      label: `${match?.name || subcategory}`,
      onRemove: () => setParam({ subcategoria: undefined }),
    });
  }
  if (format) {
    const match = facets?.formats?.find((x: any) => x.slug === format);
    activeChips.push({
      label: `${match?.label || format}`,
      onRemove: () => setParam({ formato: undefined }),
    });
  }
  if (flavor) {
    const match = facets?.flavors?.find((x: any) => x.slug === flavor);
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

      {activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 lg:px-8 border-b border-border/40 bg-background">
          {activeChips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-primary/40 bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <CategoryChips activeSlug={category} />

      <div className="px-4 pt-3 pb-2 lg:px-8 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setParam({ search: e.target.value || undefined });
            }}
            className="pl-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setParam({ search: undefined }); }}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={sort} onValueChange={(v) => setParam({ sort: v === 'newest' ? undefined : v })}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
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
            <Button variant="outline" size="icon" aria-label="Filtros">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="px-4 py-4 space-y-5">
              {/* Marcas */}
              {facets?.brands?.length > 0 && (
                <FilterSection
                  title="Marcas"
                  items={facets.brands}
                  selected={brands ? brands.split(',') : []}
                  onToggle={(slug) => {
                    const cur = brands ? brands.split(',') : [];
                    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
                    setParam({ brands: next.length ? next.join(',') : undefined });
                  }}
                />
              )}

              {/* Subcategorías */}
              {facets?.subcategories?.length > 0 && (
                <FilterSection
                  title="Subcategorías"
                  items={facets.subcategories}
                  selected={subcategory ? [subcategory] : []}
                  onToggle={(slug) =>
                    setParam({ subcategoria: subcategory === slug ? undefined : slug })
                  }
                />
              )}

              {/* Formatos */}
              {facets?.formats?.length > 0 && (
                <FilterSection
                  title="Formato"
                  items={facets.formats.map((f: any) => ({ ...f, name: f.label }))}
                  selected={format ? [format] : []}
                  onToggle={(slug) =>
                    setParam({ formato: format === slug ? undefined : slug })
                  }
                />
              )}

              {/* Sabores */}
              {facets?.flavors?.length > 0 && (
                <FilterSection
                  title="Sabor"
                  items={facets.flavors}
                  selected={flavor ? [flavor] : []}
                  onToggle={(slug) =>
                    setParam({ sabor: flavor === slug ? undefined : slug })
                  }
                />
              )}

              {/* Atributos dinámicos por categoría */}
              {dynamicAttributes.map((attr) => (
                <div key={attr.key}>
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-2">
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

              {/* Promos */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide mb-2">Promociones</h3>
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

              <SheetClose asChild>
                <Button className="w-full">Aplicar</Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="px-4 lg:px-8 pb-2">
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Cargando…' : `${total} producto${total === 1 ? '' : 's'}`}
        </p>
      </div>

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

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-muted-foreground">Cargando…</div>}>
      <CatalogContent />
    </Suspense>
  );
}
