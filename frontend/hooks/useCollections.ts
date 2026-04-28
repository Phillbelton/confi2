import { useQuery } from '@tanstack/react-query';
import { collectionService, type CollectionListParams } from '@/services/collections';

export function useCollections(params?: CollectionListParams) {
  return useQuery({
    queryKey: ['collections', params],
    queryFn: () => collectionService.getAll(params),
    staleTime: 60 * 1000, // 1 min
  });
}

/** Solo las colecciones activas y visibles en home */
export function useHomeCollections() {
  return useQuery({
    queryKey: ['collections', 'home'],
    queryFn: () => collectionService.getAll({ showOnHome: true, active: 'true' }),
    staleTime: 60 * 1000,
  });
}

export function useCollection(idOrSlug: string, mode: 'id' | 'slug' = 'slug') {
  return useQuery({
    queryKey: ['collections', mode, idOrSlug],
    queryFn: () =>
      mode === 'id'
        ? collectionService.getById(idOrSlug)
        : collectionService.getBySlug(idOrSlug),
    enabled: !!idOrSlug,
    staleTime: 60 * 1000,
  });
}

export function useCollectionProducts(slug: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['collections', 'products', slug, page, limit],
    queryFn: () => collectionService.getProducts(slug, page, limit),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
}
