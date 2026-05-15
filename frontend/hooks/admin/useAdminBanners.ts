import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminBannerService,
  type CreateBannerInput,
  type UpdateBannerInput,
} from '@/services/admin/banners';
import type { BannerPlacement } from '@/types';

export function useAdminBanners(placement?: BannerPlacement) {
  return useQuery({
    queryKey: ['admin-banners', placement || 'all'],
    queryFn: () => adminBannerService.getAll(placement),
    staleTime: 30_000,
  });
}

export function useAdminBanner(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-banner', id],
    queryFn: () => adminBannerService.getById(id!),
    enabled: !!id,
  });
}

export function useBannerOperations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-banners'] });
    qc.invalidateQueries({ queryKey: ['banners'] });
  };

  const create = useMutation({
    mutationFn: (payload: CreateBannerInput) => adminBannerService.create(payload),
    onSuccess: () => {
      toast.success('Banner creado');
      invalidate();
    },
    onError: (e: any) => toast.error('Error al crear', { description: e?.message }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBannerInput }) =>
      adminBannerService.update(id, payload),
    onSuccess: () => {
      toast.success('Banner actualizado');
      invalidate();
    },
    onError: (e: any) => toast.error('Error al actualizar', { description: e?.message }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminBannerService.remove(id),
    onSuccess: () => {
      toast.success('Banner eliminado');
      invalidate();
    },
    onError: (e: any) => toast.error('Error al eliminar', { description: e?.message }),
  });

  const uploadImage = useMutation({
    mutationFn: ({
      id,
      file,
      variant = 'main',
    }: {
      id: string;
      file: File;
      variant?: 'main' | 'mobile';
    }) => adminBannerService.uploadImage(id, file, variant),
    onSuccess: () => {
      toast.success('Imagen subida');
      invalidate();
    },
    onError: (e: any) => toast.error('Error al subir imagen', { description: e?.message }),
  });

  return {
    create: create.mutate,
    isCreating: create.isPending,
    createAsync: create.mutateAsync,
    update: update.mutate,
    isUpdating: update.isPending,
    remove: remove.mutate,
    isRemoving: remove.isPending,
    uploadImage: uploadImage.mutate,
    isUploadingImage: uploadImage.isPending,
  };
}
