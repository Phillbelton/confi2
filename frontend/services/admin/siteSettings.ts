import { adminApi } from '@/lib/adminApi';
import type { ApiResponse } from '@/types';
import type { CatalogPresentationVariant } from '@/services/siteSettings';

export const adminSiteSettingsService = {
  async get(): Promise<{ catalogPresentationVariant: CatalogPresentationVariant }> {
    const { data } = await adminApi.get<
      ApiResponse<{ catalogPresentationVariant: CatalogPresentationVariant }>
    >('/site-settings');
    return {
      catalogPresentationVariant: data.data?.catalogPresentationVariant ?? 'D',
    };
  },

  async save(variant: CatalogPresentationVariant): Promise<void> {
    await adminApi.put('/site-settings', { catalogPresentationVariant: variant });
  },
};

export default adminSiteSettingsService;
