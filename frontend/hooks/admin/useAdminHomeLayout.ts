import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminHomeLayoutService } from '@/services/admin/homeLayout';
import type { HomeSection } from '@/types';
import { getApiErrorMessage } from '@/lib/apiError';

export function useAdminHomeLayout() {
  return useQuery({
    queryKey: ['admin-home-layout'],
    queryFn: adminHomeLayoutService.get,
    staleTime: 30_000,
  });
}

export function useHomeLayoutOperations() {
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: (sections: HomeSection[]) =>
      adminHomeLayoutService.save(sections),
    onSuccess: () => {
      toast.success('Orden de la home guardado');
      qc.invalidateQueries({ queryKey: ['admin-home-layout'] });
      qc.invalidateQueries({ queryKey: ['home-layout'] });
    },
    onError: (e) =>
      toast.error('Error al guardar el orden', { description: getApiErrorMessage(e) }),
  });

  return {
    save: save.mutate,
    saveAsync: save.mutateAsync,
    isSaving: save.isPending,
  };
}
