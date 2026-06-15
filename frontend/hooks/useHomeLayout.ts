import { useQuery } from '@tanstack/react-query';
import { homeLayoutService, DEFAULT_HOME_SECTIONS } from '@/services/homeLayout';

/**
 * Layout de la home (orden + visibilidad de secciones). Si el fetch falla,
 * cae al orden por defecto — la home se renderiza siempre.
 */
export function useHomeLayout() {
  const query = useQuery({
    queryKey: ['home-layout'],
    queryFn: homeLayoutService.get,
    staleTime: 60_000,
    retry: 1,
  });

  return {
    ...query,
    sections: query.data ?? (query.isError ? DEFAULT_HOME_SECTIONS : undefined),
  };
}
