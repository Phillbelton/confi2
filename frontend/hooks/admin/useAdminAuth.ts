import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { adminAuthService } from '@/services/admin/auth';
import { useAdminStore } from '@/store/useAdminStore';
import type { AdminLoginCredentials } from '@/types/admin';

export function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { setUser, logout: clearStore, setLoading } = useAdminStore();

  // Don't fetch profile on login page to avoid unnecessary 401 errors
  const isLoginPage = pathname === '/admin/login';

  // Get profile query
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: adminAuthService.getProfile,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !isLoginPage, // Only fetch when not on login page
  });

  // Clear store if profile query fails (invalid/expired token)
  // But don't clear immediately - give it time after login
  useEffect(() => {
    if (error && !isLoginPage && !isLoading) {
      // Only clear if we're not loading and there's an actual auth error
      const timer = setTimeout(() => {
        localStorage.removeItem('admin-token');
        clearStore();
        queryClient.clear();
      }, 500); // Wait 500ms before clearing to avoid race conditions

      return () => clearTimeout(timer);
    }
  }, [error, isLoginPage, isLoading, clearStore, queryClient]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: AdminLoginCredentials) =>
      adminAuthService.login(credentials),
    onSuccess: (data) => {
      // Check if user is admin or funcionario
      if (data.user.role !== 'admin' && data.user.role !== 'funcionario') {
        toast.error('Acceso denegado. Solo administradores pueden ingresar.');
        return;
      }

      // Store token in localStorage for development (cookies don't work cross-port)
      if (data.token) {
        localStorage.setItem('admin-token', data.token);
      }

      // Set user in store and cache BEFORE redirecting
      setUser(data.user);
      queryClient.setQueryData(['admin-profile'], data.user);

      // Wait a bit to ensure state is set before redirect
      setTimeout(() => {
        toast.success(`Bienvenido, ${data.user.name}!`);
        router.push('/admin');
      }, 100);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al iniciar sesión');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: adminAuthService.logout,
    onSuccess: () => {
      // Clear token from localStorage
      localStorage.removeItem('admin-token');
      clearStore();
      queryClient.clear();
      toast.success('Sesión cerrada exitosamente');
      router.push('/admin/login');
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear client state
      localStorage.removeItem('admin-token');
      clearStore();
      queryClient.clear();
      router.push('/admin/login');
      toast.error(error.message || 'Error al cerrar sesión');
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
