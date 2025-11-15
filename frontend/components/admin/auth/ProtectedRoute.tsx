'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useAdminStore } from '@/store/useAdminStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAdminAuth();
  const { setUser, _hasHydrated } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);

  // Wait for hydration to complete
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      // Update store with fetched user data
      setUser(user);
    }
  }, [user, setUser]);

  useEffect(() => {
    if (!isLoading && !user && _hasHydrated && isMounted) {
      router.push('/admin/login');
    }
  }, [isLoading, user, router, _hasHydrated, isMounted]);

  // Show loading state during hydration or auth check
  if (!isMounted || !_hasHydrated || isLoading) {
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

  // Check if user has admin or funcionario role
  if (user.role !== 'admin' && user.role !== 'funcionario') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder al panel de administración.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
