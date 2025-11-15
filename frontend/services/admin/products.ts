import { api } from '@/lib/axios';
import type {
  ProductParent,
  ProductVariant,
  ApiResponse,
  ProductQueryParams,
} from '@/types';

// ============================================================================
// PRODUCT PARENT (Admin CRUD)
// ============================================================================

export interface CreateProductParentInput {
  name: string;
  description: string;
  categories: string[];
  brand?: string;
  images?: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  variantAttributes?: {
    name: string;
    displayName: string;
    order: number;
    values: {
      value: string;
      displayValue: string;
      order: number;
    }[];
  }[];
  featured?: boolean;
  active?: boolean;
}

export interface UpdateProductParentInput extends Partial<CreateProductParentInput> {
  tieredDiscounts?: {
    attribute: string;
    attributeValue: string;
    tiers: {
      minQuantity: number;
      maxQuantity: number | null;
      type: 'percentage' | 'amount';
      value: number;
    }[];
    startDate?: string;
    endDate?: string;
    badge?: string;
    active: boolean;
  }[];
}

export interface CreateProductVariantInput {
  parentProduct: string;
  sku?: string;
  attributes: { [key: string]: string };
  price: number;
  stock: number;
  images?: string[];
  description?: string;
  trackStock?: boolean;
  allowBackorder?: boolean;
  lowStockThreshold?: number;
  fixedDiscount?: {
    enabled: boolean;
    type: 'percentage' | 'amount';
    value: number;
    startDate?: string;
    endDate?: string;
    badge?: string;
  };
  active?: boolean;
  order?: number;
}

export interface UpdateProductVariantInput extends Partial<CreateProductVariantInput> {}

export interface UpdateStockInput {
  stock: number;
  reason?: string;
}

export const adminProductService = {
  // ============================================================================
  // PRODUCT PARENT CRUD
  // ============================================================================

  createProductParent: async (data: CreateProductParentInput): Promise<ProductParent> => {
    const response = await api.post<ApiResponse<ProductParent>>('/products/parents', data);
    return response.data.data;
  },

  updateProductParent: async (id: string, data: UpdateProductParentInput): Promise<ProductParent> => {
    const response = await api.put<ApiResponse<ProductParent>>(`/products/parents/${id}`, data);
    return response.data.data;
  },

  deleteProductParent: async (id: string): Promise<void> => {
    await api.delete(`/products/parents/${id}`);
  },

  uploadProductParentImages: async (id: string, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post<ApiResponse<{ imageUrls: string[] }>>(
      `/products/parents/${id}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.imageUrls;
  },

  deleteProductParentImage: async (id: string, filename: string): Promise<void> => {
    await api.delete(`/products/parents/${id}/images/${filename}`);
  },

  // ============================================================================
  // PRODUCT VARIANT CRUD
  // ============================================================================

  createProductVariant: async (data: CreateProductVariantInput): Promise<ProductVariant> => {
    const response = await api.post<ApiResponse<ProductVariant>>('/products/variants', data);
    return response.data.data;
  },

  updateProductVariant: async (id: string, data: UpdateProductVariantInput): Promise<ProductVariant> => {
    const response = await api.put<ApiResponse<ProductVariant>>(`/products/variants/${id}`, data);
    return response.data.data;
  },

  updateVariantStock: async (id: string, data: UpdateStockInput): Promise<ProductVariant> => {
    const response = await api.patch<ApiResponse<ProductVariant>>(`/products/variants/${id}/stock`, data);
    return response.data.data;
  },

  deleteProductVariant: async (id: string): Promise<void> => {
    await api.delete(`/products/variants/${id}`);
  },

  uploadProductVariantImages: async (id: string, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post<ApiResponse<{ imageUrls: string[] }>>(
      `/products/variants/${id}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.imageUrls;
  },

  deleteProductVariantImage: async (id: string, filename: string): Promise<void> => {
    await api.delete(`/products/variants/${id}/images/${filename}`);
  },

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  bulkUpdateStock: async (updates: { variantId: string; stock: number }[]): Promise<void> => {
    await Promise.all(
      updates.map((update) =>
        api.patch(`/products/variants/${update.variantId}/stock`, { stock: update.stock })
      )
    );
  },

  bulkToggleActive: async (productIds: string[], active: boolean): Promise<void> => {
    await Promise.all(
      productIds.map((id) =>
        api.put(`/products/parents/${id}`, { active })
      )
    );
  },
};

export default adminProductService;
