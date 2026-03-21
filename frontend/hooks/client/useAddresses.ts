'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addressService, type Address, type CreateAddressData, type UpdateAddressData } from '@/services/client/addresses';

/**
 * Hook para obtener todas las direcciones
 */
export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para crear una dirección
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressData) => addressService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Dirección agregada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al agregar dirección');
    },
  });
}

/**
 * Hook para actualizar una dirección
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressData }) =>
      addressService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Dirección actualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar dirección');
    },
  });
}

/**
 * Hook para eliminar una dirección
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Dirección eliminada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar dirección');
    },
  });
}

/**
 * Hook para marcar una dirección como predeterminada
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Dirección predeterminada actualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar dirección');
    },
  });
}

/**
 * Hook combinado para todas las operaciones de direcciones
 */
export function useAddressActions() {
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    setDefault: setDefaultMutation.mutate,
    setDefaultAsync: setDefaultMutation.mutateAsync,
    isSettingDefault: setDefaultMutation.isPending,

    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      setDefaultMutation.isPending,
  };
}
