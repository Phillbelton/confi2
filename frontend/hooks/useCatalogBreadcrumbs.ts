import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Category, Brand, Format, Flavor, Collection, Product, ApiResponse } from '@/types';
import type { BreadcrumbItem } from '@/components/m/detail/Breadcrumbs';

interface CatalogContext {
  categorySlug?: string;
  subcategorySlug?: string;
  collectionSlug?: string;
  brandsParam?: string; // primer brand de la lista
  formatSlug?: string;
  flavorSlug?: string;
}

/**
 * Devuelve breadcrumbs según los filtros activos del catálogo.
 * Patrón: Inicio › (Colección | Categoría) › Subcategoría
 */
export function useCatalogBreadcrumbs(ctx: CatalogContext): BreadcrumbItem[] {
  // Categories (todas, para resolver slugs → name)
  const { data: cats = [] } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ categories: Category[] }>>(
        '/categories?includeInactive=true'
      );
      return data.data?.categories || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: collection } = useQuery({
    queryKey: ['collection', 'slug', ctx.collectionSlug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ collection: Collection }>>(
        `/collections/slug/${ctx.collectionSlug}`
      );
      return data.data?.collection;
    },
    enabled: !!ctx.collectionSlug,
    staleTime: 5 * 60_000,
  });

  return useMemo(() => {
    const items: BreadcrumbItem[] = [];

    // Caso 1: viene de colección
    if (ctx.collectionSlug && collection) {
      items.push({
        label: collection.name,
        emoji: collection.emoji,
        href: `/m/productos?coleccion=${collection.slug}`,
        current: !ctx.subcategorySlug && !ctx.categorySlug,
      });
      return items;
    }

    // Caso 2: categoría — derivar path completo (3 niveles)
    // Si hay subcategorySlug, ese es el slug más profundo activo.
    // Si no, categorySlug es el más profundo.
    const deepestSlug = ctx.subcategorySlug || ctx.categorySlug;
    if (deepestSlug) {
      const path = buildCategoryPath(deepestSlug, cats);
      path.forEach((c, i) => {
        items.push({
          label: c.name,
          href: `/m/productos?categoria=${c.slug}`,
          current: i === path.length - 1,
        });
      });
    }

    return items;
  }, [cats, collection, ctx.collectionSlug, ctx.categorySlug, ctx.subcategorySlug]);
}

/**
 * Reconstruye el path desde la raíz hasta una categoría (incluyéndola).
 * Útil para breadcrumbs de 3 niveles: Heladería › Helados › Cassata.
 */
function buildCategoryPath(slug: string, all: Category[]): Category[] {
  const target = all.find((c) => c.slug === slug);
  if (!target) return [];
  return buildPathFromCategory(target, all);
}

/**
 * Recorre hacia arriba siguiendo `.parent` para armar el path completo.
 * Funciona si `parent` es un ID string (necesita el `all` para resolver) o
 * si ya viene populado como objeto Category.
 */
function buildPathFromCategory(target: Category, all?: Category[]): Category[] {
  const path: Category[] = [target];
  let parentRef = target.parent;
  while (parentRef) {
    if (typeof parentRef === 'object' && parentRef !== null) {
      // Ya viene populado
      path.unshift(parentRef as Category);
      parentRef = (parentRef as Category).parent;
    } else if (all) {
      // Es un ID string, lo buscamos en `all`
      const parent = all.find((c) => c._id === parentRef);
      if (!parent) break;
      path.unshift(parent);
      parentRef = parent.parent;
    } else {
      break;
    }
  }
  return path;
}

/**
 * Breadcrumbs para el detalle de un producto.
 * Patrón: Inicio › Categoría primaria › Subcategoría (si aplica) › Producto
 *
 * Si viene desde un contexto (ej. ?from=...), prevalece sobre la taxonomía.
 */
export function useProductBreadcrumbs(
  product: Product | undefined,
  fromCtx?: CatalogContext
): BreadcrumbItem[] {
  const ctxItems = useCatalogBreadcrumbs(fromCtx || {});

  // Cargar todas las categorías para resolver path completo (3 niveles)
  const { data: allCats = [] } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ categories: Category[] }>>(
        '/categories?includeInactive=true'
      );
      return data.data?.categories || [];
    },
    staleTime: 5 * 60_000,
  });

  return useMemo(() => {
    if (!product) return [];

    const items: BreadcrumbItem[] = [];
    const cats = product.categories as Category[] | undefined;

    if (ctxItems.length > 0) {
      ctxItems.forEach((it) => items.push({ ...it, current: false }));
    } else if (cats && cats.length > 0 && typeof cats[0] === 'object') {
      const primary = cats[0] as Category;
      // Si parent viene como string, usar allCats; si viene populado, ignorar allCats
      const path = buildPathFromCategory(primary, allCats);
      path.forEach((c) => {
        items.push({
          label: c.name,
          href: `/m/productos?categoria=${c.slug}`,
        });
      });
    }

    // Producto al final
    items.push({
      label: product.name,
      current: true,
    });

    return items;
  }, [product, ctxItems, allCats]);
}
