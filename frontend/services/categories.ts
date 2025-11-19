import { api } from '@/lib/axios';
import type { Category, ApiResponse } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import { buildCategoryTree } from '@/lib/categoryUtils';

export const categoryService = {
  // Get all categories (flat array for compatibility)
  getAll: async () => {
    const { data } = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
    // Backend returns { success: true, data: { categories: [...] } }
    // We need to unwrap to return just the categories array
    return (data.data as any)?.categories || [];
  },

  // Get all categories preserving hierarchy
  getAllHierarchical: async (): Promise<CategoryWithSubcategories[]> => {
    const { data } = await api.get<ApiResponse<{ categories: CategoryWithSubcategories[] }>>('/categories');
    const categories = (data.data as any)?.categories || [];

    // If backend already returns hierarchical data, use it
    if (categories.length > 0 && categories[0].subcategories !== undefined) {
      return categories;
    }

    // Otherwise, build the tree ourselves
    return buildCategoryTree(categories);
  },

  // Get main categories (no parent)
  getMainCategories: async () => {
    const { data } = await api.get<ApiResponse<{ categories: Category[] }>>('/categories/main');
    // Backend returns { success: true, data: { categories: [...] } }
    return (data.data as any)?.categories || [];
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
    const { data } = await api.get<ApiResponse<{ subcategories: Category[] }>>(
      `/categories/${parentId}/subcategories`
    );
    // Backend returns { success: true, data: { subcategories: [...] } }
    return (data.data as any)?.subcategories || [];
  },
};

export default categoryService;
