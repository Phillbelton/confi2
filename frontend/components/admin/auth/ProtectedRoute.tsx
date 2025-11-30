'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useAdminStore } from '@/store/useAdminStore';

type UserRole = 'admin' | 'funcionario' | 'cliente';

// Define which routes are accessible by which roles
const roleRoutePermissions: Record<string, UserRole[]> = {
  '/admin': ['admin', 'funcionario'], // Dashboard
  '/admin/productos': ['admin', 'funcionario'],
  '/admin/inventario': ['admin', 'funcionario'],
  '/admin/ordenes': ['admin'], // Solo admin
  '/admin/categorias': ['admin'], // Solo admin
  '/admin/marcas': ['admin'], // Solo admin
  '/admin/usuarios': ['admin'], // Solo admin
  '/admin/reportes': ['admin'], // Solo admin
  '/admin/auditoria': ['admin'], // Solo admin
  '/funcionario': ['funcionario'], // Funcionario dashboard
};

// Check if user has permission to access a route
function hasRoutePermission(pathname: string, userRole: UserRole): boolean {
  // Check exact match first
  if (roleRoutePermissions[pathname]) {
    return roleRoutePermissions[pathname].includes(userRole);
  }

  // Check parent routes (e.g., /admin/ordenes/123 -> /admin/ordenes)
  const pathParts = pathname.split('/').filter(Boolean);
  for (let i = pathParts.length; i > 0; i--) {
    const parentPath = '/' + pathParts.slice(0, i).join('/');
    if (roleRoutePermissions[parentPath]) {
      return roleRoutePermissions[parentPath].includes(userRole);
    }
  }

  // Default: deny access to unknown routes
  return false;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  // Check if user has permission to access this specific route
  if (!hasRoutePermission(pathname, user.role as UserRole)) {
    // Redirect funcionario to their dashboard if they try to access admin-only routes
    if (user.role === 'funcionario') {
      router.push('/funcionario');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
