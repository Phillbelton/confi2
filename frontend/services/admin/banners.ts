import { adminApi } from '@/lib/adminApi';
import type {
  Banner,
  BannerPlacement,
  BannerSize,
  BannerCols,
  BannerMobileMode,
  BannerLink,
  ApiResponse,
} from '@/types';

export interface CreateBannerInput {
  placement: BannerPlacement;
  order?: number;
  size?: BannerSize;
  rowOrder?: number;
  cols?: BannerCols;
  mobileMode?: BannerMobileMode;
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

/** Un item del bulk de layout: sólo viajan los campos a actualizar. */
export interface LayoutItem {
  id: string;
  order?: number;
  rowOrder?: number;
  cols?: BannerCols;
  mobileMode?: BannerMobileMode;
}

interface BannerImagePayload {
  image?: string;
  imageMobile?: string;
}

export const adminBannerService = {
  async getAll(placement?: BannerPlacement): Promise<Banner[]> {
    const { data } = await adminApi.get<ApiResponse<{ banners: Banner[] }>>(
      '/banners',
      { params: placement ? { placement } : {} }
    );
    return data.data?.banners ?? [];
  },

  async getById(id: string): Promise<Banner> {
    const { data } = await adminApi.get<ApiResponse<{ banner: Banner }>>(
      `/banners/${id}`
    );
    return data.data.banner;
  },

  async create(payload: CreateBannerInput): Promise<Banner> {
    const { data } = await adminApi.post<ApiResponse<{ banner: Banner }>>(
      '/banners',
      payload
    );
    return data.data.banner;
  },

  async update(id: string, payload: UpdateBannerInput): Promise<Banner> {
    const { data } = await adminApi.put<ApiResponse<{ banner: Banner }>>(
      `/banners/${id}`,
      payload
    );
    return data.data.banner;
  },

  async remove(id: string): Promise<void> {
    await adminApi.delete(`/banners/${id}`);
  },

  /**
   * Guarda el layout completo (orden + franjas) en una sola llamada.
   * Acepta items parciales: sólo se persisten los campos presentes.
   */
  async saveLayout(items: LayoutItem[]): Promise<void> {
    await adminApi.patch('/banners/reorder', { items });
  },

  /** Upload de imagen principal (?variant=main) o mobile (?variant=mobile) */
  async uploadImage(
    id: string,
    file: File,
    variant: 'main' | 'mobile' = 'main'
  ): Promise<BannerImagePayload> {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await adminApi.post<ApiResponse<BannerImagePayload>>(
      `/banners/${id}/image?variant=${variant}`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data ?? {};
  },
};

export default adminBannerService;
