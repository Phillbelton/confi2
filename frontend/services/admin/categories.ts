import { adminApi } from '@/lib/adminApi';
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
    const { data } = await adminApi.get('/categories?includeInactive=true');
    return data;
  },

  /**
   * Get main categories (no parent)
   */
  async getMainCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    const { data } = await adminApi.get('/categories/main');
    return data;
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    const { data } = await adminApi.get(`/categories/${id}`);
    return data;
  },

  /**
   * Get subcategories of a parent category
   */
  async getSubcategories(parentId: string): Promise<ApiResponse<{ subcategories: Category[] }>> {
    const { data } = await adminApi.get(`/categories/${parentId}/subcategories`);
    return data;
  },

  /**
   * Create a new category
   */
  async create(data: CreateCategoryInput): Promise<ApiResponse<Category>> {
    const { data: response } = await adminApi.post('/categories', data);
    return response;
  },

  /**
   * Update an existing category
   */
  async update(id: string, data: UpdateCategoryInput): Promise<ApiResponse<Category>> {
    const { data: response } = await adminApi.put(`/categories/${id}`, data);
    return response;
  },

  /**
   * Delete a category (soft delete if has products)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const { data } = await adminApi.delete(`/categories/${id}`);
    return data;
  },

  /**
   * Upload category image.
   *
   * `variant` controla el encuadre destino:
   *  - 'thumb'        → miniatura 1:1 (campo `image`)
   *  - 'banner'       → hero catálogo desktop 20:3 (`bannerImage`)
   *  - 'bannerMobile' → hero catálogo mobile 5:2 (`bannerImageMobile`)
   *  - 'master'       → el backend recorta y genera los 3 encuadres
   */
  async uploadImage(
    id: string,
    file: File,
    variant: CategoryImageVariant = 'thumb'
  ): Promise<ApiResponse<CategoryImagesPayload>> {
    const formData = new FormData();
    formData.append('image', file);

    const { data } = await adminApi.post(
      `/categories/${id}/image?variant=${variant}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
};

export type CategoryImageVariant = 'thumb' | 'banner' | 'bannerMobile' | 'master';

/** URLs actualizadas que devuelve el endpoint de upload (los 3 encuadres). */
export interface CategoryImagesPayload {
  image?: string;
  bannerImage?: string;
  bannerImageMobile?: string;
}
