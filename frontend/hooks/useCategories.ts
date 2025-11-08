import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMainCategories() {
  return useQuery({
    queryKey: ['categories', 'main'],
    queryFn: () => categoryService.getMainCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
}

export function useSubcategories(parentId: string) {
  return useQuery({
    queryKey: ['categories', parentId, 'subcategories'],
    queryFn: () => categoryService.getSubcategories(parentId),
    enabled: !!parentId,
  });
}
