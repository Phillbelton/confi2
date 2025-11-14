import { api } from '@/lib/axios';
import type {
  ProductParent,
  ProductVariant,
  ProductQueryParams,
  ApiPaginatedResponse,
  ApiResponse,
  TieredDiscountPreview,
} from '@/types';

// ============================================================================
// PRODUCT PARENT ENDPOINTS
// ============================================================================

export const productService = {
  // Get all products with filters and pagination
  getProducts: async (params?: ProductQueryParams) => {
    const { data } = await api.get<ApiResponse<{ data: ProductParent[], pagination: any }>>(
      '/products/parents',
      { params }
    );
    // Backend returns { success: true, data: { data: [...], pagination: {...} } }
    // We need to unwrap to return just { data: [...], pagination: {...} }
    return data.data as any;
  },

  // Get featured products
  getFeaturedProducts: async () => {
    const { data } = await api.get<ApiResponse<ProductParent[]>>(
      '/products/parents/featured'
    );
    return data;
  },

  // Get single product by ID
  getProductById: async (id: string) => {
    const { data } = await api.get<ApiResponse<ProductParent>>(
      `/products/parents/${id}`
    );
    return data;
  },

  // Get single product by slug
  getProductBySlug: async (slug: string) => {
    const { data } = await api.get<ApiResponse<ProductParent>>(
      `/products/parents/slug/${slug}`
    );
    return data;
  },

  // Get product variants
  getProductVariants: async (parentId: string) => {
    const { data } = await api.get<ApiResponse<ProductVariant[]>>(
      `/products/parents/${parentId}/variants`
    );
    return data;
  },

  // ============================================================================
  // VARIANT ENDPOINTS
  // ============================================================================

  // Get variant by ID
  getVariantById: async (variantId: string) => {
    const { data } = await api.get<ApiResponse<ProductVariant>>(
      `/products/variants/${variantId}`
    );
    return data;
  },

  // Get variant by SKU
  getVariantBySku: async (sku: string) => {
    const { data } = await api.get<ApiResponse<ProductVariant>>(
      `/products/variants/sku/${sku}`
    );
    return data;
  },

  // Get discount preview for variant
  getDiscountPreview: async (variantId: string, quantity: number) => {
    const { data } = await api.get<ApiResponse<TieredDiscountPreview>>(
      `/products/variants/${variantId}/discount-preview`,
      { params: { quantity } }
    );
    return data;
  },

  // Get low stock variants (admin only)
  getLowStockVariants: async () => {
    const { data } = await api.get<ApiResponse<ProductVariant[]>>(
      '/products/variants/stock/low'
    );
    return data;
  },

  // Get out of stock variants (admin only)
  getOutOfStockVariants: async () => {
    const { data } = await api.get<ApiResponse<ProductVariant[]>>(
      '/products/variants/stock/out'
    );
    return data;
  },
};

export default productService;
