'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientStore } from '@/store/useClientStore';
import { clientAuthService, type LoginCredentials, type RegisterData, type UpdateProfileData } from '@/services/client/auth';
import { getApiErrorMessage } from '@/lib/apiError';

/**
 * Hook para verificar y obtener el perfil del cliente
 */
export function useClientProfile() {
  const { setUser, setLoading, _hasHydrated } = useClientStore();

  return useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const user = await clientAuthService.getProfile();
      setUser(user);
      return user;
    },
    enabled: _hasHydrated && typeof window !== 'undefined' && !!localStorage.getItem('client-token'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false,
    meta: {
      onError: () => {
        setUser(null);
        setLoading(false);
      },
    },
  });
}

/**
 * Hook para login de cliente
 * @param redirectTo - URL to redirect after successful login (defaults to /perfil)
 */
export function useClientLogin(redirectTo?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setLoading } = useClientStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => clientAuthService.login(credentials),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      // Solo cuentas de rol 'cliente' pueden usar el storefront. Admin y
      // funcionario tienen sus propios portales (/admin/login, /funcionario/login)
      // y endpoints como /api/orders/my-orders les responden 403, llevando a
      // pantallas rotas. Acá rechazamos el login y limpiamos el token que el
      // service ya guardó en localStorage. Espejo de useAdminAuth.useAdminLogin.
      if (data.user.role !== 'cliente') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('client-token');
        }
        setLoading(false);
        const msg =
          data.user.role === 'admin'
            ? 'Esta cuenta es de administrador. Ingresá por /admin/login.'
            : data.user.role === 'funcionario'
              ? 'Esta cuenta es de funcionario. Ingresá por /funcionario/login.'
              : 'Esta cuenta no tiene acceso al portal de clientes.';
        toast.error(msg);
        return;
      }
      setUser(data.user);
      queryClient.setQueryData(['client-profile'], data.user);
      toast.success('¡Bienvenido de vuelta!');
      router.push(redirectTo || '/perfil');
    },
    onError: (error) => {
      setLoading(false);
      toast.error(getApiErrorMessage(error, 'Error al iniciar sesión'));
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook para registro de cliente
 * @param redirectTo - URL to redirect after successful registration (defaults to /perfil)
 */
export function useClientRegister(redirectTo?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setLoading } = useClientStore();

  return useMutation({
    mutationFn: (data: RegisterData) => clientAuthService.register(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['client-profile'], data.user);
      toast.success('¡Cuenta creada exitosamente!');
      router.push(redirectTo || '/perfil');
    },
    onError: (error) => {
      setLoading(false);
      toast.error(getApiErrorMessage(error, 'Error al crear cuenta'));
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook para logout de cliente
 */
export function useClientLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout, setLoading } = useClientStore();

  return useMutation({
    mutationFn: () => clientAuthService.logout(),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      logout();
      queryClient.removeQueries({ queryKey: ['client-profile'] });
      queryClient.removeQueries({ queryKey: ['my-orders'] });
      queryClient.removeQueries({ queryKey: ['addresses'] });
      toast.success('Sesión cerrada');
      router.push('/');
    },
    onError: () => {
      // Even on error, clear local state
      logout();
      router.push('/');
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook para actualizar perfil
 */
export function useUpdateClientProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useClientStore();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => clientAuthService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['client-profile'], updatedUser);
      toast.success('Perfil actualizado');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar perfil'));
    },
  });
}

/**
 * Hook para cambiar contraseña
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      clientAuthService.changePassword(data),
    onSuccess: () => {
      toast.success('Contraseña actualizada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Error al cambiar contraseña'));
    },
  });
}

/**
 * Hook principal de autenticación cliente
 */
export function useClientAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    _hasHydrated,
    setLoading,
  } = useClientStore();

  const { refetch: refetchProfile, isLoading: isProfileLoading } = useClientProfile();

  const loginMutation = useClientLogin();
  const registerMutation = useClientRegister();
  const logoutMutation = useClientLogout();
  const updateProfileMutation = useUpdateClientProfile();

  // Verificar autenticación al montar
  useEffect(() => {
    if (_hasHydrated) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('client-token') : null;
      if (token && !user) {
        refetchProfile();
      } else {
        setLoading(false);
      }
    }
  }, [_hasHydrated, user, refetchProfile, setLoading]);

  const requireAuth = useCallback(
    (redirectTo: string = '/login') => {
      if (_hasHydrated && !isLoading && !isAuthenticated) {
        router.push(redirectTo);
        return false;
      }
      return isAuthenticated;
    },
    [_hasHydrated, isLoading, isAuthenticated, router]
  );

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isProfileLoading || !_hasHydrated,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    requireAuth,
    refetchProfile,
  };
}

export default useClientAuth;
