import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import type { ProductQueryParams } from '@/types';

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeaturedProducts(),
    staleTime: 60 * 1000, // 1 minute
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

export function useProductVariants(parentId: string) {
  return useQuery({
    queryKey: ['products', parentId, 'variants'],
    queryFn: () => productService.getProductVariants(parentId),
    enabled: !!parentId,
  });
}
