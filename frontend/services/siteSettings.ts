import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';

/** Variante de presentación de la card: B (inline simple), C (inline+escalera) o D (bottom-sheet). */
export type CatalogPresentationVariant = 'B' | 'C' | 'D';
export const DEFAULT_CATALOG_PRESENTATION_VARIANT: CatalogPresentationVariant = 'D';

/** Navegación de categorías del header: 'bar' (fila con raíces visibles,
 *  diseño nuevo) o 'dropdown' (botón "Categorías" junto al logo, el anterior). */
export type CatalogNavStyle = 'bar' | 'dropdown';
export const DEFAULT_CATALOG_NAV_STYLE: CatalogNavStyle = 'bar';

export interface SiteSettings {
  catalogPresentationVariant: CatalogPresentationVariant;
  catalogNavStyle: CatalogNavStyle;
}

export const siteSettingsService = {
  /** Ajustes públicos del sitio. Fallback a los defaults si el GET falla. */
  get: async (): Promise<SiteSettings> => {
    const { data } = await api.get<ApiResponse<SiteSettings>>('/site-settings');
    return {
      catalogPresentationVariant:
        data.data?.catalogPresentationVariant ??
        DEFAULT_CATALOG_PRESENTATION_VARIANT,
      catalogNavStyle: data.data?.catalogNavStyle ?? DEFAULT_CATALOG_NAV_STYLE,
    };
  },
};

export default siteSettingsService;
