import { api } from '@/lib/axios';
import type { Category, ApiResponse } from '@/types';

export const categoryService = {
  // Get all categories
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories');
    return data;
  },

  // Get main categories (no parent)
  getMainCategories: async () => {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories/main');
    return data;
  },

  // Get category by ID
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return data;
  },

  // Get category by slug
  getBySlug: async (slug: string) => {
    const { data } = await api.get<ApiResponse<Category>>(
      `/categories/slug/${slug}`
    );
    return data;
  },

  // Get subcategories
  getSubcategories: async (parentId: string) => {
    const { data } = await api.get<ApiResponse<Category[]>>(
      `/categories/${parentId}/subcategories`
    );
    return data;
  },
};

export default categoryService;
