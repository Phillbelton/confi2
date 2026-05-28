import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminBrandService,
  type CreateBrandInput,
  type UpdateBrandInput,
} from '@/services/admin/brands';
import { getApiErrorMessage } from '@/lib/apiError';

/**
 * Hook for fetching all brands
 */
export function useAdminBrands(includeInactive?: boolean) {
  return useQuery({
    queryKey: ['admin-brands', includeInactive],
    queryFn: () => adminBrandService.getAll(includeInactive),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching a single brand by ID
 */
export function useAdminBrand(id: string) {
  return useQuery({
    queryKey: ['admin-brand', id],
    queryFn: () => adminBrandService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for brand CRUD operations
 */
export function useBrandOperations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateBrandInput) => adminBrandService.create(data),
    onSuccess: (response) => {
      toast.success('Marca creada correctamente', {
        description: response.data.name,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
    onError: (error) => {
      toast.error('Error al crear marca', { description: getApiErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBrandInput }) =>
      adminBrandService.update(id, data),
    onSuccess: (response) => {
      toast.success('Marca actualizada correctamente', {
        description: response.data.name,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['admin-brand'] });
    },
    onError: (error) => {
      toast.error('Error al actualizar marca', { description: getApiErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminBrandService.delete(id),
    onSuccess: () => {
      toast.success('Marca eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
    onError: (error) => {
      toast.error('Error al eliminar marca', {
        description: getApiErrorMessage(error, 'Esta marca tiene productos asociados'),
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminBrandService.uploadLogo(id, file),
    onSuccess: () => {
      toast.success('Logo cargado correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['admin-brand'] });
    },
    onError: (error) => {
      toast.error('Error al cargar logo', { description: getApiErrorMessage(error) });
    },
  });

  return {
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteBrand: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    uploadLogo: uploadLogoMutation.mutate,
    isUploadingLogo: uploadLogoMutation.isPending,
  };
}
