import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminCategoryService,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/services/admin/categories';
import { getApiErrorMessage } from '@/lib/apiError';

/**
 * Hook for fetching all categories
 */
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCategoryService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching main categories
 */
export function useMainCategories() {
  return useQuery({
    queryKey: ['main-categories'],
    queryFn: () => adminCategoryService.getMainCategories(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching subcategories
 */
export function useSubcategories(parentId: string) {
  return useQuery({
    queryKey: ['subcategories', parentId],
    queryFn: () => adminCategoryService.getSubcategories(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for category CRUD operations
 */
export function useCategoryOperations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryInput) => adminCategoryService.create(data),
    onSuccess: (response) => {
      toast.success('Categoría creada correctamente', {
        description: response.data.name,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
    },
    onError: (error) => {
      toast.error('Error al crear categoría', { description: getApiErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      adminCategoryService.update(id, data),
    onSuccess: (response) => {
      toast.success('Categoría actualizada correctamente', {
        description: response.data.name,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
    onError: (error) => {
      toast.error('Error al actualizar categoría', { description: getApiErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCategoryService.delete(id),
    onSuccess: () => {
      toast.success('Categoría eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
    onError: (error) => {
      toast.error('Error al eliminar categoría', {
        description: getApiErrorMessage(error, 'Esta categoría tiene productos asociados'),
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminCategoryService.uploadImage(id, file),
    onSuccess: () => {
      toast.success('Imagen cargada correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['main-categories'] });
    },
    onError: (error) => {
      toast.error('Error al cargar imagen', { description: getApiErrorMessage(error) });
    },
  });

  return {
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteCategory: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    uploadImage: uploadImageMutation.mutate,
    isUploadingImage: uploadImageMutation.isPending,
  };
}
