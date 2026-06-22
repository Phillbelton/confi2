import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminSiteSettingsService } from '@/services/admin/siteSettings';
import type { CatalogPresentationVariant } from '@/services/siteSettings';
import { getApiErrorMessage } from '@/lib/apiError';

export function useAdminSiteSettings() {
  return useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: adminSiteSettingsService.get,
    staleTime: 30_000,
  });
}

export function useSiteSettingsOperations() {
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: (variant: CatalogPresentationVariant) =>
      adminSiteSettingsService.save(variant),
    onSuccess: () => {
      toast.success('Apariencia guardada');
      qc.invalidateQueries({ queryKey: ['admin-site-settings'] });
      qc.invalidateQueries({ queryKey: ['site-settings'] });
    },
    onError: (e) =>
      toast.error('Error al guardar', { description: getApiErrorMessage(e) }),
  });

  return { save: save.mutate, isSaving: save.isPending };
}
