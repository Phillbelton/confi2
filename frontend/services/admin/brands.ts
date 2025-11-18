import { apiClient } from '../api';
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
    return apiClient.get(`/brands${params}`);
  },

  /**
   * Get brand by ID
   */
  async getById(id: string): Promise<ApiResponse<Brand>> {
    return apiClient.get(`/brands/${id}`);
  },

  /**
   * Get brand by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Brand>> {
    return apiClient.get(`/brands/slug/${slug}`);
  },

  /**
   * Create a new brand
   */
  async create(data: CreateBrandInput): Promise<ApiResponse<Brand>> {
    return apiClient.post('/brands', data);
  },

  /**
   * Update an existing brand
   */
  async update(id: string, data: UpdateBrandInput): Promise<ApiResponse<Brand>> {
    return apiClient.put(`/brands/${id}`, data);
  },

  /**
   * Delete a brand (soft delete if has products)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/brands/${id}`);
  },

  /**
   * Upload brand logo
   */
  async uploadLogo(id: string, file: File): Promise<ApiResponse<Brand>> {
    const formData = new FormData();
    formData.append('image', file);

    return apiClient.post(`/brands/${id}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
