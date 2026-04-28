import { api } from '@/lib/axios';
import type { ApiResponse, ProductFacets } from '@/types';

export interface FacetQueryParams {
  category?: string; // ID o slug — el backend resuelve ambos
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  collection?: string;
}

export const facetsService = {
  get: async (params: FacetQueryParams = {}): Promise<ProductFacets> => {
    const { data } = await api.get<ApiResponse<ProductFacets>>(
      '/products/parents/facets',
      { params }
    );
    return data.data as ProductFacets;
  },
};

export default facetsService;
