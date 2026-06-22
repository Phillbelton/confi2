import { api } from '@/lib/axios';
import type { Product, ApiResponse, PaginationMeta, ProductFacets } from '@/types';

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
  presentacion?: string;
  minPrice?: number;
  maxPrice?: number;
  active?: 'true' | 'false' | 'all';
  featured?: boolean;
  onSale?: boolean;
  search?: string;
  collection?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'popular';
}

// El backend devuelve la lista paginada con esta forma. Lo extraemos
// para reutilizar el tipo de retorno en consumidores que lo necesiten.
export interface PaginatedProducts {
  data: Product[];
  pagination: PaginationMeta;
}

// Forma laxa de los params para facets: el backend acepta cualquier
// filtro del catálogo público (categories, brands, minPrice, etc.).
// Los valores siempre son string|number|boolean serializables a query.
export type FacetsQueryParams = Record<string, string | number | boolean | undefined>;

export const productService = {
  getProducts: async (params?: ProductQueryParams): Promise<PaginatedProducts> => {
    const { data } = await api.get<ApiResponse<PaginatedProducts>>(
      '/products',
      { params }
    );
    return data.data;
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
  getFacets: async (params?: FacetsQueryParams): Promise<ProductFacets> => {
    const { data } = await api.get<ApiResponse<ProductFacets>>('/products/facets', { params });
    return data.data;
  },
};

export default productService;
