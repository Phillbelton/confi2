import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminCollectionService,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from '@/services/admin/collections';

export function useAdminCollections(active: 'true' | 'false' | 'all' = 'all') {
  return useQuery({
    queryKey: ['admin-collections', active],
    queryFn: () => adminCollectionService.getAll(active),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminCollection(id: string) {
  return useQuery({
    queryKey: ['admin-collection', id],
    queryFn: () => adminCollectionService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/** Hook con todas las mutaciones admin de colecciones e invalidación de caches relacionados. */
export function useCollectionOperations() {
  const queryClient = useQueryClient();

  /**
   * Invalida todos los caches afectados por mutaciones de Collection:
   * - Listas admin
   * - Listas públicas (home, sheet de filtros)
   * - Productos (porque ?coleccion= depende de la lista)
   * - Facetas (porque las collections son una dimensión)
   */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    queryClient.invalidateQueries({ queryKey: ['admin-collection'] });
    queryClient.invalidateQueries({ queryKey: ['collections'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['facets'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateCollectionInput) => adminCollectionService.create(data),
    onSuccess: (response) => {
      const name = (response.data as any)?.collection?.name;
      toast.success('Colección creada', { description: name });
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error('Error al crear colección', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCollectionInput }) =>
      adminCollectionService.update(id, data),
    onSuccess: (response) => {
      const name = (response.data as any)?.collection?.name;
      toast.success('Colección actualizada', { description: name });
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error('Error al actualizar colección', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCollectionService.remove(id),
    onSuccess: () => {
      toast.success('Colección eliminada');
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error('Error al eliminar colección', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; order: number }[]) =>
      adminCollectionService.reorder(items),
    onSuccess: () => {
      toast.success('Orden actualizado');
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error('Error al reordenar', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminCollectionService.uploadImage(id, file),
    onSuccess: () => {
      toast.success('Imagen subida correctamente');
      invalidateAll();
    },
    onError: (error: any) => {
      toast.error('Error al subir imagen', {
        description: error?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  return {
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteCollection: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    reorder: reorderMutation.mutate,
    isReordering: reorderMutation.isPending,
    uploadImage: uploadImageMutation.mutate,
    isUploadingImage: uploadImageMutation.isPending,
  };
}
