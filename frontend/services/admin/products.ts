import { adminApi } from '@/lib/adminApi';
import type { Product, ApiResponse, SaleUnit, ProductTier } from '@/types';
import type { ProductQueryParams } from '@/services/products';

export interface CreateProductInput {
  name: string;
  description: string;
  categories: string[];
  brand?: string;
  format?: string;
  flavor?: string;
  barcode?: string;
  provider?: string;
  unitPrice: number;
  saleUnit: SaleUnit;
  tiers?: ProductTier[];
  images?: string[];
  featured?: boolean;
  active?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export const adminProductService = {
  list: async (params?: ProductQueryParams) => {
    const { data } = await adminApi.get<ApiResponse<{ data: Product[]; pagination: any }>>(
      '/products',
      { params: { ...params, active: 'all' } }
    );
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await adminApi.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
    return data.data;
  },
  create: async (input: CreateProductInput | FormData) => {
    const isFormData = input instanceof FormData;
    const { data } = await adminApi.post<ApiResponse<{ product: Product }>>(
      '/products',
      input,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data.data;
  },
  update: async (id: string, input: UpdateProductInput) => {
    const { data } = await adminApi.put<ApiResponse<{ product: Product }>>(
      `/products/${id}`,
      input
    );
    return data.data;
  },
  remove: async (id: string) => {
    const { data } = await adminApi.delete<ApiResponse<null>>(`/products/${id}`);
    return data;
  },
  uploadImages: async (id: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    const { data } = await adminApi.post<ApiResponse<{ images: string[] }>>(
      `/products/${id}/images`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },
};

export default adminProductService;
