'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useFuncionarioAuth } from '@/hooks/funcionario/useFuncionarioAuth';
import { useFuncionarioStore } from '@/store/useFuncionarioStore';

export function FuncionarioProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useFuncionarioAuth();
  const { setUser, _hasHydrated } = useFuncionarioStore();

  useEffect(() => {
    if (user) {
      // Update store with fetched user data
      setUser(user);
    }
  }, [user, setUser]);

  useEffect(() => {
    if (!isLoading && !user && _hasHydrated) {
      router.push('/funcionario/login');
    }
  }, [isLoading, user, router, _hasHydrated]);

  // Show loading state during hydration or auth check
  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render (will redirect)
  if (!user) {
    return null;
  }

  // Check if user is funcionario
  if (user.role !== 'funcionario') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            Solo funcionarios pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
