import { adminApi } from '@/lib/adminApi';
import type { Brand, ApiResponse } from '@/types';

export interface CreateBrandInput {
  name: string;
  logo?: string;
  active?: boolean;
}

export interface UpdateBrandInput {
  name?: string;
  logo?: string;
  active?: boolean;
}

export const adminBrandService = {
  /**
   * Get all brands
   */
  async getAll(includeInactive?: boolean): Promise<ApiResponse<{ brands: Brand[] }>> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const { data } = await adminApi.get(`/brands${params}`);
    return data;
  },

  /**
   * Get brand by ID
   */
  async getById(id: string): Promise<ApiResponse<Brand>> {
    const { data } = await adminApi.get(`/brands/${id}`);
    return data;
  },

  /**
   * Get brand by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Brand>> {
    const { data } = await adminApi.get(`/brands/slug/${slug}`);
    return data;
  },

  /**
   * Create a new brand
   */
  async create(data: CreateBrandInput): Promise<ApiResponse<Brand>> {
    const { data: response } = await adminApi.post('/brands', data);
    return response;
  },

  /**
   * Update an existing brand
   */
  async update(id: string, data: UpdateBrandInput): Promise<ApiResponse<Brand>> {
    const { data: response } = await adminApi.put(`/brands/${id}`, data);
    return response;
  },

  /**
   * Delete a brand (soft delete if has products)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const { data } = await adminApi.delete(`/brands/${id}`);
    return data;
  },

  /**
   * Upload brand logo
   */
  async uploadLogo(id: string, file: File): Promise<ApiResponse<Brand>> {
    const formData = new FormData();
    formData.append('image', file);

    const { data } = await adminApi.post(`/brands/${id}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
