import { api } from '@/lib/axios';
import type { Category, ApiResponse } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';

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
   * Get all categories (hierarchical structure from backend)
   */
  async getAll(): Promise<ApiResponse<{ categories: CategoryWithSubcategories[] }>> {
    const { data } = await api.get('/categories?includeInactive=true');
    return data;
  },

  /**
   * Get main categories (no parent)
   */
  async getMainCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    const { data } = await api.get('/categories/main');
    return data;
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    const { data } = await api.get(`/categories/${id}`);
    return data;
  },

  /**
   * Get subcategories of a parent category
   */
  async getSubcategories(parentId: string): Promise<ApiResponse<{ subcategories: Category[] }>> {
    const { data } = await api.get(`/categories/${parentId}/subcategories`);
    return data;
  },

  /**
   * Create a new category
   */
  async create(data: CreateCategoryInput): Promise<ApiResponse<Category>> {
    const { data: response } = await api.post('/categories', data);
    return response;
  },

  /**
   * Update an existing category
   */
  async update(id: string, data: UpdateCategoryInput): Promise<ApiResponse<Category>> {
    const { data: response } = await api.put(`/categories/${id}`, data);
    return response;
  },

  /**
   * Delete a category (soft delete if has products)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },

  /**
   * Upload category image
   */
  async uploadImage(id: string, file: File): Promise<ApiResponse<Category>> {
    const formData = new FormData();
    formData.append('image', file);

    const { data } = await api.post(`/categories/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
