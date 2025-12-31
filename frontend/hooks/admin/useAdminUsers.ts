import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService, type UserFilters, type CreateUserData, type UpdateUserData } from '@/services/users';

/**
 * Hook para obtener usuarios con filtros y paginación
 */
export function useAdminUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => userService.getUsers(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook para obtener un usuario por ID
 */
export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener funcionarios activos
 */
export function useAdminFuncionarios() {
  return useQuery({
    queryKey: ['admin-funcionarios'],
    queryFn: () => userService.getFuncionarios(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para operaciones CRUD de usuarios
 */
export function useUserOperations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => userService.createUser(data),
    onSuccess: (user) => {
      toast.success('Usuario creado correctamente', {
        description: user.name,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-funcionarios'] });
    },
    onError: (error: any) => {
      toast.error('Error al crear usuario', {
        description: error.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      userService.updateUser(id, data),
    onSuccess: (user) => {
      toast.success('Usuario actualizado correctamente', {
        description: user.name,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user'] });
      queryClient.invalidateQueries({ queryKey: ['admin-funcionarios'] });
    },
    onError: (error: any) => {
      toast.error('Error al actualizar usuario', {
        description: error.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      userService.changePassword(id, newPassword),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al cambiar contraseña', {
        description: error.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => userService.deactivateUser(id),
    onSuccess: () => {
      toast.success('Usuario desactivado correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-funcionarios'] });
    },
    onError: (error: any) => {
      toast.error('Error al desactivar usuario', {
        description: error.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => userService.activateUser(id),
    onSuccess: (user) => {
      toast.success('Usuario activado correctamente', {
        description: user.name,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-funcionarios'] });
    },
    onError: (error: any) => {
      toast.error('Error al activar usuario', {
        description: error.message || 'Ocurrió un error inesperado',
      });
    },
  });

  return {
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    deactivate: deactivateMutation.mutate,
    isDeactivating: deactivateMutation.isPending,
    activate: activateMutation.mutate,
    isActivating: activateMutation.isPending,
  };
}
