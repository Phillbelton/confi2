import { api } from '@/lib/axios';
import type { Category, FacetableAttribute, ApiResponse } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import { buildCategoryTree } from '@/lib/categoryUtils';

/**
 * El backend (`GET /categories`) devuelve una lista plana donde cada nodo
 * ADEMÁS embebe sus hijos directos en `subcategories[]`. Es decir: cada
 * categoría hija aparece dos veces en la respuesta (una en su posición flat,
 * otra dentro del padre). Cualquier consumidor que recorra ambos niveles
 * duplica entries. Estos helpers normalizan a una forma sin ambigüedad.
 */
function dedupeById(raw: any[]): Category[] {
  const byId = new Map<string, Category>();
  const visit = (c: any) => {
    if (c?._id && !byId.has(c._id)) byId.set(c._id, c);
    if (Array.isArray(c?.subcategories)) c.subcategories.forEach(visit);
  };
  raw.forEach(visit);
  return Array.from(byId.values());
}

export const categoryService = {
  // Get all categories (flat array for compatibility)
  getAll: async () => {
    const { data } = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
    // Backend returns { success: true, data: { categories: [...] } }
    // We need to unwrap to return just the categories array
    return (data.data as any)?.categories || [];
  },

  /**
   * Lista plana SIN duplicados y SIN el campo `subcategories` embebido.
   * Forma limpia para selects, filtros y cualquier consumo lineal.
   */
  getAllFlat: async (): Promise<Category[]> => {
    const { data } = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
    const raw = (data.data as any)?.categories || [];
    return dedupeById(raw).map(({ subcategories, ...rest }: any) => rest as Category);
  },

  /**
   * Árbol: solo categorías raíz, cada una con `subcategories[]` poblado.
   * Forma correcta para vistas jerárquicas / agrupadas.
   */
  getAllTree: async (): Promise<CategoryWithSubcategories[]> => {
    const { data } = await api.get<ApiResponse<{ categories: CategoryWithSubcategories[] }>>('/categories');
    const raw = (data.data as any)?.categories || [];
    const all = dedupeById(raw);
    if (all.length > 0 && (all[0] as any).subcategories !== undefined) {
      return all.filter((c) => !c.parent) as CategoryWithSubcategories[];
    }
    return buildCategoryTree(all);
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

  // Get effective facetable attributes for a category (self + ancestors deduped)
  getFacetableAttributes: async (categoryId: string): Promise<FacetableAttribute[]> => {
    const { data } = await api.get<ApiResponse<{ attributes: FacetableAttribute[] }>>(
      `/categories/${categoryId}/facetable-attributes`
    );
    return (data.data as any)?.attributes || [];
  },
};

export default categoryService;
