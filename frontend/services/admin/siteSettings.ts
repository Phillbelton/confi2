import { adminApi } from '@/lib/adminApi';
import type { ApiResponse } from '@/types';
import type {
  CatalogPresentationVariant,
  CatalogNavStyle,
  SiteSettings,
} from '@/services/siteSettings';

/** Payload de guardado: parcial — solo se persisten los campos presentes. */
export interface SiteSettingsUpdate {
  catalogPresentationVariant?: CatalogPresentationVariant;
  catalogNavStyle?: CatalogNavStyle;
}

export const adminSiteSettingsService = {
  async get(): Promise<SiteSettings> {
    const { data } = await adminApi.get<ApiResponse<SiteSettings>>('/site-settings');
    return {
      catalogPresentationVariant: data.data?.catalogPresentationVariant ?? 'D',
      catalogNavStyle: data.data?.catalogNavStyle ?? 'bar',
    };
  },

  async save(update: SiteSettingsUpdate): Promise<void> {
    await adminApi.put('/site-settings', update);
  },
};

export default adminSiteSettingsService;
