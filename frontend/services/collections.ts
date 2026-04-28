import { api } from '@/lib/axios';
import type { Collection, ApiResponse, ProductParent } from '@/types';

export interface CollectionListParams {
  showOnHome?: boolean;
  active?: 'true' | 'false' | 'all';
  search?: string;
}

export interface CollectionProductsResponse {
  collection: Collection;
  data: ProductParent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const collectionService = {
  // Listado público
  getAll: async (params?: CollectionListParams) => {
    const { data } = await api.get<ApiResponse<{ collections: Collection[] }>>(
      '/collections',
      {
        params: {
          ...(params?.showOnHome !== undefined
            ? { showOnHome: params.showOnHome ? 'true' : 'false' }
            : {}),
          ...(params?.active !== undefined ? { active: params.active } : {}),
          ...(params?.search ? { search: params.search } : {}),
        },
      }
    );
    return (data.data as any)?.collections || [];
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<{ collection: Collection }>>(
      `/collections/${id}`
    );
    return (data.data as any)?.collection;
  },

  getBySlug: async (slug: string) => {
    const { data } = await api.get<ApiResponse<{ collection: Collection }>>(
      `/collections/slug/${slug}`
    );
    return (data.data as any)?.collection;
  },

  getProducts: async (slug: string, page = 1, limit = 20) => {
    const { data } = await api.get<ApiResponse<CollectionProductsResponse>>(
      `/collections/slug/${slug}/products`,
      { params: { page, limit } }
    );
    return data.data as CollectionProductsResponse;
  },

  // Admin
  create: async (payload: Partial<Collection>) => {
    const { data } = await api.post<ApiResponse<{ collection: Collection }>>(
      '/collections',
      payload
    );
    return (data.data as any)?.collection;
  },

  update: async (id: string, payload: Partial<Collection>) => {
    const { data } = await api.put<ApiResponse<{ collection: Collection }>>(
      `/collections/${id}`,
      payload
    );
    return (data.data as any)?.collection;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse<unknown>>(`/collections/${id}`);
    return data;
  },

  reorder: async (items: { id: string; order: number }[]) => {
    const { data } = await api.patch<ApiResponse<unknown>>('/collections/reorder', {
      items,
    });
    return data;
  },
};

export default collectionService;
