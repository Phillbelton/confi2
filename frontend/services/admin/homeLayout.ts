import { adminApi } from '@/lib/adminApi';
import type { ApiResponse, HomeLayoutSection } from '@/types';

export const adminHomeLayoutService = {
  async get(): Promise<HomeLayoutSection[]> {
    const { data } = await adminApi.get<ApiResponse<{ sections: HomeLayoutSection[] }>>(
      '/home-layout'
    );
    return data.data?.sections ?? [];
  },

  /** Reemplaza el layout completo (debe traer las 9 secciones). */
  async save(sections: HomeLayoutSection[]): Promise<void> {
    await adminApi.put('/home-layout', { sections });
  },
};

export default adminHomeLayoutService;
