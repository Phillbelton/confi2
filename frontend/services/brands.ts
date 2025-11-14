import { api } from '@/lib/axios';
import type { Brand, ApiResponse } from '@/types';

export const brandService = {
  // Get all brands
  getAll: async () => {
    const { data } = await api.get<ApiResponse<{ brands: Brand[] }>>('/brands');
    // Backend returns { success: true, data: { brands: [...] } }
    // We need to unwrap to return just the brands array
    return (data.data as any)?.brands || [];
  },

  // Get brand by ID
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Brand>>(`/brands/${id}`);
    return data;
  },
};

export default brandService;
