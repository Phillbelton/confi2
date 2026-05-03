import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Collection, ApiResponse } from '@/types';

export function useHomeCollections() {
  return useQuery({
    queryKey: ['collections', 'home'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ collections: Collection[] }>>(
        '/collections',
        { params: { showOnHome: 'true', active: 'true' } }
      );
      return data.data?.collections || [];
    },
    staleTime: 60_000,
  });
}

export function useCollection(slugOrId: string, by: 'slug' | 'id' = 'slug') {
  return useQuery({
    queryKey: ['collections', by, slugOrId],
    queryFn: async () => {
      const path = by === 'slug' ? `/collections/slug/${slugOrId}` : `/collections/${slugOrId}`;
      const { data } = await api.get<ApiResponse<{ collection: Collection }>>(path);
      return data.data?.collection;
    },
    enabled: !!slugOrId,
    staleTime: 60_000,
  });
}
