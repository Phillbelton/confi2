import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categories';

/**
 * @deprecated La respuesta cruda del backend duplica las subcategorías
 * (aparecen flat y embebidas dentro del padre). Para nuevos consumos usar
 * `useCategoriesFlat()` (lista limpia sin duplicados) o `useCategoriesTree()`
 * (jerárquico). Se mantiene para compatibilidad de consumidores existentes.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Lista plana de categorías, deduplicada y sin `subcategories` embebido. */
export function useCategoriesFlat() {
  return useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: () => categoryService.getAllFlat(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Árbol: solo raíces, cada una con `subcategories[]`. */
export function useCategoriesTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryService.getAllTree(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoriesHierarchical() {
  return useQuery({
    queryKey: ['categories', 'hierarchical'],
    queryFn: () => categoryService.getAllHierarchical(),
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
