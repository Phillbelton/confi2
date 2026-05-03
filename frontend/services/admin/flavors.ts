import { adminApi } from '@/lib/adminApi';
import type { Flavor, ApiResponse } from '@/types';

export interface CreateFlavorInput {
  name: string;
  color?: string;
  active?: boolean;
}
export type UpdateFlavorInput = Partial<CreateFlavorInput>;

export const flavorService = {
  list: async () => {
    const { data } = await adminApi.get<ApiResponse<{ flavors: Flavor[] }>>('/flavors', {
      params: { active: 'all' },
    });
    return data.data.flavors;
  },
  publicList: async () => {
    const { data } = await adminApi.get<ApiResponse<{ flavors: Flavor[] }>>('/flavors');
    return data.data.flavors;
  },
  create: async (input: CreateFlavorInput) => {
    const { data } = await adminApi.post<ApiResponse<{ flavor: Flavor }>>('/flavors', input);
    return data.data.flavor;
  },
  update: async (id: string, input: UpdateFlavorInput) => {
    const { data } = await adminApi.put<ApiResponse<{ flavor: Flavor }>>(`/flavors/${id}`, input);
    return data.data.flavor;
  },
  remove: async (id: string) => {
    const { data } = await adminApi.delete<ApiResponse<null>>(`/flavors/${id}`);
    return data;
  },
};
