import { api } from '@/lib/axios';
import type { Product, ApiResponse } from '@/types';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  categories?: string;
  subcategory?: string;
  brand?: string;
  brands?: string;
  format?: string;
  flavor?: string;
  minPrice?: number;
  maxPrice?: number;
  active?: 'true' | 'false' | 'all';
  featured?: boolean;
  onSale?: boolean;
  search?: string;
  collection?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'popular';
}

export const productService = {
  getProducts: async (params?: ProductQueryParams) => {
    const { data } = await api.get<ApiResponse<{ data: Product[]; pagination: any }>>(
      '/products',
      { params }
    );
    return data.data as { data: Product[]; pagination: any };
  },
  getFeaturedProducts: async (limit = 8) => {
    const { data } = await api.get<ApiResponse<{ data: Product[] }>>(
      '/products/featured',
      { params: { limit } }
    );
    return data.data;
  },
  getProductById: async (id: string) => {
    const { data } = await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
    return data.data;
  },
  getProductBySlug: async (slug: string) => {
    const { data } = await api.get<ApiResponse<{ product: Product }>>(`/products/slug/${slug}`);
    return data.data;
  },
  getFacets: async (params?: any) => {
    const { data } = await api.get<ApiResponse<any>>('/products/facets', { params });
    return data.data;
  },
};

export default productService;
