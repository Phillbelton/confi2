import { adminApi } from '@/lib/adminApi';
import type { ApiResponse, HomeSection } from '@/types';

export const adminHomeLayoutService = {
  async get(): Promise<HomeSection[]> {
    const { data } = await adminApi.get<ApiResponse<{ sections: HomeSection[] }>>(
      '/home-layout'
    );
    return data.data?.sections ?? [];
  },

  /** Reemplaza el layout completo (estructura validada por el backend). */
  async save(sections: HomeSection[]): Promise<void> {
    await adminApi.put('/home-layout', { sections });
  },
};

export default adminHomeLayoutService;
