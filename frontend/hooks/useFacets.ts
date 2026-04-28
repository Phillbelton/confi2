import { useQuery } from '@tanstack/react-query';
import { facetsService, type FacetQueryParams } from '@/services/productFacets';

/**
 * Devuelve facetas dinámicas (counts por dimensión) para los filtros del catálogo.
 * Cascada UNIDIRECCIONAL: solo `category + search + price + collection` afectan los counts.
 * Marcas y promos seleccionadas NO invalidan este hook (no se incluyen en queryKey).
 */
export function useFacets(params: FacetQueryParams = {}) {
  return useQuery({
    queryKey: ['facets', params],
    queryFn: () => facetsService.get(params),
    staleTime: 30 * 1000,
  });
}
