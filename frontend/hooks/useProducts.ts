import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productService, type ProductQueryParams, type FacetsQueryParams } from '@/services/products';

/**
 * Autocompletado del buscador. Solo consulta con ≥2 caracteres y conserva el
 * resultado previo entre teclas (`placeholderData`) para que el dropdown no
 * parpadee mientras el usuario escribe.
 */
export function useSearchSuggestions(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ['product-suggestions', term],
    queryFn: () => productService.getSuggestions(term),
    enabled: term.length >= 2,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
    staleTime: 30_000,
  });
}

// Catálogo paginado por acumulación ("Cargar más"). El backend pagina con
// `page`; expone hasNext/hasPrev (algunos endpoints legacy usan hasNextPage).
export function useInfiniteProducts(params?: Omit<ProductQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params],
    queryFn: ({ pageParam }) =>
      productService.getProducts({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const p = last.pagination;
      const page = p?.page ?? p?.currentPage ?? 1;
      const hasNext =
        p?.hasNext ?? p?.hasNextPage ?? (p?.totalPages ? page < p.totalPages : false);
      return hasNext ? page + 1 : undefined;
    },
    staleTime: 30_000,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 60_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['products', 'slug', slug],
    queryFn: () => productService.getProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useFacets(params?: FacetsQueryParams) {
  return useQuery({
    queryKey: ['facets', params],
    queryFn: () => productService.getFacets(params),
    staleTime: 30_000,
  });
}
