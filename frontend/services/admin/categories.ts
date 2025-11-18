import { apiClient } from '../api';
import type { Category, ApiResponse } from '@/types';

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parent?: string;
  icon?: string;
  color?: string;
  order?: number;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parent?: string;
  icon?: string;
  color?: string;
  order?: number;
  active?: boolean;
}

export const adminCategoryService = {
  /**
   * Get all categories
   */
  async getAll(): Promise<ApiResponse<{ categories: Category[] }>> {
    return apiClient.get('/categories');
  },

  /**
   * Get main categories (no parent)
   */
  async getMainCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return apiClient.get('/categories/main');
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    return apiClient.get(`/categories/${id}`);
  },

  /**
   * Get subcategories of a parent category
   */
  async getSubcategories(parentId: string): Promise<ApiResponse<{ subcategories: Category[] }>> {
    return apiClient.get(`/categories/${parentId}/subcategories`);
  },

  /**
   * Create a new category
   */
  async create(data: CreateCategoryInput): Promise<ApiResponse<Category>> {
    return apiClient.post('/categories', data);
  },

  /**
   * Update an existing category
   */
  async update(id: string, data: UpdateCategoryInput): Promise<ApiResponse<Category>> {
    return apiClient.put(`/categories/${id}`, data);
  },

  /**
   * Delete a category (soft delete if has products)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/categories/${id}`);
  },

  /**
   * Upload category image
   */
  async uploadImage(id: string, file: File): Promise<ApiResponse<Category>> {
    const formData = new FormData();
    formData.append('image', file);

    return apiClient.post(`/categories/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
