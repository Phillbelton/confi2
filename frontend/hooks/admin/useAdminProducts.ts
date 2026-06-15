import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminProductService,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/services/admin/products';
import type { ProductQueryParams } from '@/services/products';
import { getApiErrorMessage } from '@/lib/apiError';

export function useAdminProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => adminProductService.list(params),
    staleTime: 30_000,
  });
}

export function useAdminProductStats() {
  return useQuery({
    queryKey: ['admin-products', 'stats'],
    queryFn: () => adminProductService.stats(),
    staleTime: 30_000,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminProductService.getById(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useProductOperations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['admin-product'] });
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['facets'] });
  };

  const createMut = useMutation({
    mutationFn: (input: CreateProductInput | FormData) => adminProductService.create(input),
    onSuccess: () => {
      toast.success('Producto creado');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Error al crear producto')),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      adminProductService.update(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Error al actualizar')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminProductService.remove(id),
    onSuccess: () => {
      toast.success('Producto eliminado');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Error al eliminar')),
  });

  const uploadImagesMut = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      adminProductService.uploadImages(id, files),
    onSuccess: () => {
      toast.success('Imágenes subidas');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Error al subir las imágenes')),
  });

  const deleteImageMut = useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      adminProductService.deleteImage(id, filename),
    onSuccess: () => {
      toast.success('Imagen eliminada');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Error al eliminar imagen')),
  });

  return {
    create: createMut.mutate,
    isCreating: createMut.isPending,
    update: updateMut.mutate,
    isUpdating: updateMut.isPending,
    remove: deleteMut.mutate,
    isDeleting: deleteMut.isPending,
    uploadImages: uploadImagesMut.mutate,
    isUploading: uploadImagesMut.isPending,
    deleteImage: deleteImageMut.mutateAsync,
    isDeletingImage: deleteImageMut.isPending,
  };
}
