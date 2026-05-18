import { adminApi } from '@/lib/adminApi';
import type { Banner, BannerPlacement, BannerSize, BannerLink, ApiResponse } from '@/types';

export interface CreateBannerInput {
  placement: BannerPlacement;
  order?: number;
  size?: BannerSize;
  image: string;
  imageMobile?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  link: BannerLink;
  active?: boolean;
  startDate?: string;
  endDate?: string;
}

export type UpdateBannerInput = Partial<CreateBannerInput>;

export const adminBannerService = {
  async getAll(placement?: BannerPlacement) {
    const { data } = await adminApi.get<ApiResponse<{ banners: Banner[] }>>(
      '/banners',
      { params: placement ? { placement } : {} }
    );
    return (data.data as any)?.banners || [];
  },

  async getById(id: string): Promise<Banner> {
    const { data } = await adminApi.get<ApiResponse<{ banner: Banner }>>(
      `/banners/${id}`
    );
    return (data.data as any).banner;
  },

  async create(payload: CreateBannerInput): Promise<Banner> {
    const { data } = await adminApi.post<ApiResponse<{ banner: Banner }>>(
      '/banners',
      payload
    );
    return (data.data as any).banner;
  },

  async update(id: string, payload: UpdateBannerInput): Promise<Banner> {
    const { data } = await adminApi.put<ApiResponse<{ banner: Banner }>>(
      `/banners/${id}`,
      payload
    );
    return (data.data as any).banner;
  },

  async remove(id: string): Promise<void> {
    await adminApi.delete(`/banners/${id}`);
  },

  async reorder(items: { id: string; order: number }[]): Promise<void> {
    await adminApi.patch('/banners/reorder', { items });
  },

  /** Upload de imagen principal (?variant=main) o mobile (?variant=mobile) */
  async uploadImage(
    id: string,
    file: File,
    variant: 'main' | 'mobile' = 'main'
  ): Promise<{ image?: string; imageMobile?: string }> {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await adminApi.post<ApiResponse<any>>(
      `/banners/${id}/image?variant=${variant}`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return (data.data as any) || {};
  },
};

export default adminBannerService;
