import { useQuery } from '@tanstack/react-query';
import { brandService } from '@/services/brands';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => brandService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ['brands', id],
    queryFn: () => brandService.getById(id),
    enabled: !!id,
  });
}
