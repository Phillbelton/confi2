import { api } from '@/lib/axios';
import type { ApiResponse, HomeSection } from '@/types';

/**
 * Layout por defecto de la home — espejo de DEFAULT_HOME_SECTIONS del backend.
 * Es el fallback si el GET falla: la home jamás queda en blanco.
 */
export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: 'hero', type: 'hero', active: true },
  {
    id: 'offers',
    type: 'product_carousel',
    active: true,
    config: { title: 'Ofertas', emoji: '🔥', source: 'on_sale', limit: 8 },
  },
  {
    id: 'secondary_banners',
    type: 'banner_zone',
    active: true,
    config: { placement: 'home_secondary' },
  },
  {
    id: 'featured',
    type: 'product_carousel',
    active: true,
    config: { title: 'Destacados', emoji: '⭐', source: 'featured', limit: 8 },
  },
  { id: 'collections', type: 'collections', active: true },
  { id: 'wholesale_cta', type: 'static_cta', active: true },
  {
    id: 'newest',
    type: 'product_carousel',
    active: true,
    config: { title: 'Novedades', emoji: '✨', source: 'newest', limit: 8 },
  },
  {
    id: 'promo_banners',
    type: 'banner_zone',
    active: true,
    config: { placement: 'home_promo' },
  },
  {
    id: 'best_sellers',
    type: 'product_grid',
    active: true,
    config: { title: 'Más vendidos', emoji: '🏆', source: 'popular', limit: 6 },
  },
  {
    id: 'store_locations',
    type: 'location_map',
    active: true,
    config: {
      title: 'Visita nuestras tiendas',
      emoji: '📍',
      stores: [
        {
          name: 'Confitería Quelita — Macul',
          address: 'San Luis de Macúl 5304, Macul',
          mapQuery: 'Confiteria Quelita, San Luis de Macúl 5304, Macul',
          hours: 'Lun a Sáb 8:30–20:30 · Dom 10:00–16:00',
        },
        {
          name: 'Confitería Quelita — Peñalolén',
          address: 'Av. Grecia 6740, Peñalolén',
          mapQuery: 'Confiteria Quelita, Av. Grecia 6740, Peñalolén',
          hours: 'Lun a Vie 10:30–19:30 · Sáb 10:30–18:00 · Dom cerrado',
        },
      ],
    },
  },
];

export const homeLayoutService = {
  /** Layout público de la home (orden = posición en el array). */
  get: async (): Promise<HomeSection[]> => {
    const { data } = await api.get<ApiResponse<{ sections: HomeSection[] }>>(
      '/home-layout'
    );
    return data.data?.sections ?? DEFAULT_HOME_SECTIONS;
  },
};

export default homeLayoutService;
