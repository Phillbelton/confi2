import { adminApi } from '@/lib/adminApi';
import type { Collection, ApiResponse } from '@/types';

export interface CreateCollectionInput {
  name: string;
  description?: string;
  image?: string;
  emoji?: string;
  gradient?: string;
  products?: string[];
  active?: boolean;
  showOnHome?: boolean;
  order?: number;
}

export interface UpdateCollectionInput extends Partial<CreateCollectionInput> {}

export const adminCollectionService = {
  async getAll(active: 'true' | 'false' | 'all' = 'all') {
    const { data } = await adminApi.get<ApiResponse<{ collections: Collection[] }>>(
      `/collections?active=${active}`
    );
    return data;
  },

  async getById(id: string) {
    const { data } = await adminApi.get<ApiResponse<{ collection: Collection }>>(
      `/collections/${id}`
    );
    return data;
  },

  async create(payload: CreateCollectionInput) {
    const { data } = await adminApi.post<ApiResponse<{ collection: Collection }>>(
      '/collections',
      payload
    );
    return data;
  },

  async update(id: string, payload: UpdateCollectionInput) {
    const { data } = await adminApi.put<ApiResponse<{ collection: Collection }>>(
      `/collections/${id}`,
      payload
    );
    return data;
  },

  async remove(id: string) {
    const { data } = await adminApi.delete<ApiResponse<unknown>>(`/collections/${id}`);
    return data;
  },

  async reorder(items: { id: string; order: number }[]) {
    const { data } = await adminApi.patch<ApiResponse<unknown>>(
      '/collections/reorder',
      { items }
    );
    return data;
  },

  /**
   * Subir imagen a Cloudinary y asociarla a la colección.
   * Reemplaza la imagen anterior si la había (la borra de Cloudinary).
   */
  async uploadImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await adminApi.post<ApiResponse<{ image: string }>>(
      `/collections/${id}/image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};

export default adminCollectionService;
