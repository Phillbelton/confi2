import { api } from '@/lib/axios';
import type { ApiResponse, HomeLayoutSection } from '@/types';

/**
 * Orden por defecto de la home — espejo de DEFAULT_HOME_SECTIONS del backend.
 * Es el fallback si el GET falla: la home jamás queda en blanco.
 */
export const DEFAULT_HOME_SECTIONS: HomeLayoutSection[] = [
  { key: 'hero', active: true },
  { key: 'offers', active: true },
  { key: 'secondary_banners', active: true },
  { key: 'featured', active: true },
  { key: 'collections', active: true },
  { key: 'wholesale_cta', active: true },
  { key: 'newest', active: true },
  { key: 'promo_banners', active: true },
  { key: 'best_sellers', active: true },
];

export const homeLayoutService = {
  /** Layout público de la home (orden = posición en el array). */
  get: async (): Promise<HomeLayoutSection[]> => {
    const { data } = await api.get<ApiResponse<{ sections: HomeLayoutSection[] }>>(
      '/home-layout'
    );
    return data.data?.sections ?? DEFAULT_HOME_SECTIONS;
  },
};

export default homeLayoutService;
