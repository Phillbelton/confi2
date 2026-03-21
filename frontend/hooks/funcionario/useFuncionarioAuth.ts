import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { funcionarioAuthService } from '@/services/funcionario/auth';
import { useFuncionarioStore } from '@/store/useFuncionarioStore';
import type { AdminLoginCredentials } from '@/types/admin';

export function useFuncionarioAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { setUser, logout: clearStore, setLoading } = useFuncionarioStore();

  // Don't fetch profile on login page to avoid unnecessary 401 errors
  const isLoginPage = pathname === '/funcionario/login';

  // Check if we have a token to determine if we should fetch profile
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('funcionario-token') : false;

  // Get profile query
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['funcionario-profile'],
    queryFn: funcionarioAuthService.getProfile,
    retry: false,
    staleTime: 1000 * 60 * 2, // 2 minutes - data considered fresh
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchInterval: 1000 * 60 * 3, // Auto-revalidate every 3 minutes (detects expired sessions)
    refetchOnWindowFocus: false, // Prevent refetching when window regains focus (avoids rate limit)
    refetchOnMount: false, // Prevent refetching on component mount if data exists (avoids rate limit)
    refetchOnReconnect: false, // Prevent refetching on network reconnection (avoids rate limit)
    enabled: hasToken && !isLoginPage, // Only fetch when we have token and not on login page
  });

  // Clear store if profile query fails (invalid/expired token)
  // But don't clear immediately - give it time after login
  useEffect(() => {
    if (error && !isLoginPage && !isLoading) {
      // Only clear if we're not loading and there's an actual auth error
      const timer = setTimeout(() => {
        localStorage.removeItem('funcionario-token');
        clearStore();
        queryClient.clear();
      }, 500); // Wait 500ms before clearing to avoid race conditions

      return () => clearTimeout(timer);
    }
  }, [error, isLoginPage, isLoading, clearStore, queryClient]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: AdminLoginCredentials) =>
      funcionarioAuthService.login(credentials),
    onSuccess: (data) => {
      // Check if user is funcionario
      if (data.user.role !== 'funcionario') {
        toast.error('Acceso denegado. Solo funcionarios pueden ingresar aquí.');
        return;
      }

      // Store token in localStorage for development (cookies don't work cross-port)
      if (data.token) {
        localStorage.setItem('funcionario-token', data.token);
      }

      // Set user in store and cache BEFORE redirecting
      setUser(data.user);
      queryClient.setQueryData(['funcionario-profile'], data.user);

      // Show success message
      toast.success(`Bienvenido, ${data.user.name}!`);

      // Redirect to funcionario dashboard
      setTimeout(() => {
        window.location.href = '/funcionario';
      }, 500);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al iniciar sesión');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: funcionarioAuthService.logout,
    onSuccess: () => {
      // Clear token from localStorage
      localStorage.removeItem('funcionario-token');
      clearStore();
      queryClient.clear();
      toast.success('Sesión cerrada exitosamente');
      router.push('/funcionario/login');
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear client state
      localStorage.removeItem('funcionario-token');
      clearStore();
      queryClient.clear();
      router.push('/funcionario/login');
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
