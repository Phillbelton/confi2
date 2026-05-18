import { adminApi } from '@/lib/adminApi';
import type { Format, ApiResponse } from '@/types';

export interface CreateFormatInput {
  value: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'cc' | 'oz';
  label?: string;
  active?: boolean;
}
export type UpdateFormatInput = Partial<CreateFormatInput>;

export const formatService = {
  list: async () => {
    const { data } = await adminApi.get<ApiResponse<{ formats: Format[] }>>('/formats', {
      params: { active: 'all' },
    });
    return data.data.formats;
  },
  publicList: async () => {
    const { data } = await adminApi.get<ApiResponse<{ formats: Format[] }>>('/formats');
    return data.data.formats;
  },
  create: async (input: CreateFormatInput) => {
    const { data } = await adminApi.post<ApiResponse<{ format: Format }>>('/formats', input);
    return data.data.format;
  },
  update: async (id: string, input: UpdateFormatInput) => {
    const { data } = await adminApi.put<ApiResponse<{ format: Format }>>(`/formats/${id}`, input);
    return data.data.format;
  },
  remove: async (id: string) => {
    const { data } = await adminApi.delete<ApiResponse<null>>(`/formats/${id}`);
    return data;
  },
};
