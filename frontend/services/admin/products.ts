import { adminApi } from '@/lib/adminApi';
import type {
  Product, ApiResponse, SaleUnit, ProductTier, PaginationMeta, FixedDiscount,
} from '@/types';
import type { ProductQueryParams } from '@/services/products';

export interface CreateProductInput {
  /** Opcional. Si se omite, el backend genera QU-XXXXXX. */
  sku?: string;
  name: string;
  description: string;
  categories: string[];
  brand?: string;
  format?: string;
  flavors?: string[];
  barcode?: string;
  unitPrice: number;
  saleUnit: SaleUnit;
  tiers?: ProductTier[];
  /** Oferta fija a nivel producto. El modelo la denormaliza desde la presentación
   *  principal, pero el backend también la acepta directa. */
  fixedDiscount?: FixedDiscount;
  presentaciones?: Array<{
    type: SaleUnit['type'];
    quantity: number;
    unitPrice: number;
    tiers?: ProductTier[];
    /** Oferta fija puntual de ESTA presentación (%/monto + vigencia + badge). */
    fixedDiscount?: FixedDiscount;
    label?: string;
    /** EAN propio de la presentación (la caja tiene su código). */
    barcode?: string;
    principal?: boolean;
  }>;
  images?: string[];
  featured?: boolean;
  active?: boolean;
  attributes?: Record<string, string[]>;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export const adminProductService = {
  list: async (params?: ProductQueryParams) => {
    // Default active:'all' (el admin ve todo), pero el caller puede
    // sobreescribirlo (filtro Activos/Inactivos). Antes el spread iba al
    // revés y `active` del caller quedaba SIEMPRE pisado por 'all'.
    const { data } = await adminApi.get<ApiResponse<{ data: Product[]; pagination: PaginationMeta }>>(
      '/products',
      { params: { active: 'all', ...params } }
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
  deleteImage: async (id: string, filename: string) => {
    const { data } = await adminApi.delete<ApiResponse<{ images: string[] }>>(
      `/products/${id}/images/${encodeURIComponent(filename)}`
    );
    return data.data;
  },
  stats: async () => {
    const { data } = await adminApi.get<ApiResponse<{ stats: AdminProductStats }>>(
      '/products/admin-stats'
    );
    return data.data.stats;
  },
};

export interface AdminProductStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  noImage: number;
  noFormat: number;
  noBrand: number;
  noCategory: number;
}

export default adminProductService;
