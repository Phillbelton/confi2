import { useQuery } from '@tanstack/react-query';
import {
  siteSettingsService,
  DEFAULT_CATALOG_PRESENTATION_VARIANT,
  type CatalogPresentationVariant,
} from '@/services/siteSettings';

/**
 * Variante de presentación de la card del catálogo, definida por el admin.
 * Si el fetch falla, cae al default — la card siempre tiene cómo renderizar.
 */
export function useCatalogPresentationVariant(): CatalogPresentationVariant {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: siteSettingsService.get,
    staleTime: 60_000,
    retry: 1,
  });
  return data?.catalogPresentationVariant ?? DEFAULT_CATALOG_PRESENTATION_VARIANT;
}
