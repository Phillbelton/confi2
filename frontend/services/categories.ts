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

// Forma extendida (sólo a nivel de helper) que reconoce el campo opcional
// `subcategories[]` embebido por el backend en la respuesta plana.
type CategoryWithEmbeddedChildren = Category & {
  subcategories?: CategoryWithEmbeddedChildren[];
};

function dedupeById(raw: CategoryWithEmbeddedChildren[]): CategoryWithEmbeddedChildren[] {
  const byId = new Map<string, CategoryWithEmbeddedChildren>();
  const visit = (c: CategoryWithEmbeddedChildren) => {
    if (c?._id && !byId.has(c._id)) byId.set(c._id, c);
    if (Array.isArray(c?.subcategories)) c.subcategories.forEach(visit);
  };
  raw.forEach(visit);
  return Array.from(byId.values());
}

export const categoryService = {
  // Get all categories (flat array for compatibility)
  getAll: async (): Promise<Category[]> => {
    const { data } = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
    return data.data?.categories ?? [];
  },

  /**
   * Lista plana SIN duplicados y SIN el campo `subcategories` embebido.
   * Forma limpia para selects, filtros y cualquier consumo lineal.
   */
  getAllFlat: async (): Promise<Category[]> => {
    const { data } = await api.get<ApiResponse<{ categories: CategoryWithEmbeddedChildren[] }>>('/categories');
    const raw = data.data?.categories ?? [];
    return dedupeById(raw).map(({ subcategories: _subcategories, ...rest }) => rest as Category);
  },

  /**
   * Árbol: solo categorías raíz, cada una con `subcategories[]` poblado.
   * Forma correcta para vistas jerárquicas / agrupadas.
   */
  getAllTree: async (): Promise<CategoryWithSubcategories[]> => {
    const { data } = await api.get<ApiResponse<{ categories: CategoryWithEmbeddedChildren[] }>>('/categories');
    const raw = data.data?.categories ?? [];
    const all = dedupeById(raw);
    if (all.length > 0 && (all[0] as CategoryWithEmbeddedChildren).subcategories !== undefined) {
      return all.filter((c) => !c.parent) as CategoryWithSubcategories[];
    }
    return buildCategoryTree(all);
  },

  // Get all categories preserving hierarchy
  getAllHierarchical: async (): Promise<CategoryWithSubcategories[]> => {
    const { data } = await api.get<ApiResponse<{ categories: CategoryWithSubcategories[] }>>('/categories');
    const categories = data.data?.categories ?? [];

    // If backend already returns hierarchical data, use it
    if (categories.length > 0 && categories[0].subcategories !== undefined) {
      return categories;
    }

    // Otherwise, build the tree ourselves
    return buildCategoryTree(categories);
  },

  // Get main categories (no parent)
  getMainCategories: async (): Promise<Category[]> => {
    const { data } = await api.get<ApiResponse<{ categories: Category[] }>>('/categories/main');
    return data.data?.categories ?? [];
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
  getSubcategories: async (parentId: string): Promise<Category[]> => {
    const { data } = await api.get<ApiResponse<{ subcategories: Category[] }>>(
      `/categories/${parentId}/subcategories`
    );
    return data.data?.subcategories ?? [];
  },

  // Get effective facetable attributes for a category (self + ancestors deduped)
  getFacetableAttributes: async (categoryId: string): Promise<FacetableAttribute[]> => {
    const { data } = await api.get<ApiResponse<{ attributes: FacetableAttribute[] }>>(
      `/categories/${categoryId}/facetable-attributes`
    );
    return data.data?.attributes ?? [];
  },
};

export default categoryService;
