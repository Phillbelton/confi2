import { useQuery } from '@tanstack/react-query';
import {
  siteSettingsService,
  DEFAULT_CATALOG_PRESENTATION_VARIANT,
  DEFAULT_CATALOG_NAV_STYLE,
  type CatalogPresentationVariant,
  type CatalogNavStyle,
} from '@/services/siteSettings';

/** Query compartida de los ajustes públicos del sitio (una sola request). */
function useSiteSettingsQuery() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: siteSettingsService.get,
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Variante de presentación de la card del catálogo, definida por el admin.
 * Si el fetch falla, cae al default — la card siempre tiene cómo renderizar.
 */
export function useCatalogPresentationVariant(): CatalogPresentationVariant {
  const { data } = useSiteSettingsQuery();
  return data?.catalogPresentationVariant ?? DEFAULT_CATALOG_PRESENTATION_VARIANT;
}

/**
 * Estilo de navegación de categorías del header ('bar' | 'dropdown'), definido
 * por el admin en /admin/apariencia. Mismo patrón de fallback al default.
 */
export function useCatalogNavStyle(): CatalogNavStyle {
  const { data } = useSiteSettingsQuery();
  return data?.catalogNavStyle ?? DEFAULT_CATALOG_NAV_STYLE;
}
