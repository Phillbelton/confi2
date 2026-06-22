import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';

/** Variante de presentación de la card: B (inline simple), C (inline+escalera) o D (bottom-sheet). */
export type CatalogPresentationVariant = 'B' | 'C' | 'D';
export const DEFAULT_CATALOG_PRESENTATION_VARIANT: CatalogPresentationVariant = 'D';

export interface SiteSettings {
  catalogPresentationVariant: CatalogPresentationVariant;
}

export const siteSettingsService = {
  /** Ajustes públicos del sitio. Fallback al default si el GET falla. */
  get: async (): Promise<SiteSettings> => {
    const { data } = await api.get<ApiResponse<SiteSettings>>('/site-settings');
    return {
      catalogPresentationVariant:
        data.data?.catalogPresentationVariant ??
        DEFAULT_CATALOG_PRESENTATION_VARIANT,
    };
  },
};

export default siteSettingsService;
