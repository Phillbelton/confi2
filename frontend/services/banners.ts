import { api } from '@/lib/axios';
import type { Banner, ApiResponse, BannerPlacement } from '@/types';

export const bannerService = {
  /** Listado público — filtra por schedule activo en backend */
  getByPlacement: async (placement: BannerPlacement): Promise<Banner[]> => {
    const { data } = await api.get<ApiResponse<{ banners: Banner[] }>>('/banners', {
      params: { placement, active: 'true' },
    });
    return data.data?.banners ?? [];
  },
};

export default bannerService;
