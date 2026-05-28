'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/hooks/client/useClientAuth';
import { useClientStore } from '@/store/useClientStore';
import { useOrderNotifications } from '@/hooks/client/useOrderNotifications';
import { MobileShell } from '@/components/m/shell/MobileShell';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useClientAuth();
  useOrderNotifications();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // Defensa contra sesión con rol incorrecto guardada en localStorage.
    // Ocurre si una cuenta admin/funcionario se logueó por /login y quedó
    // su token en `client-token`. Endpoints como /orders/my-orders devuelven
    // 403, rompiendo la UI. Limpiamos y pateamos al login.
    if (user && user.role !== 'cliente') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('client-token');
        localStorage.removeItem('client-storage');
      }
      useClientStore.getState().logout();
      router.push('/login?error=role');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <MobileShell>
        <div className="px-4 py-6 space-y-4 lg:px-8">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </MobileShell>
    );
  }

  if (!isAuthenticated) return null;
  // Sesión con rol no-cliente: no renderizar; el useEffect ya disparó el redirect.
  if (user && user.role !== 'cliente') return null;

  return (
    <MobileShell>
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </div>
    </MobileShell>
  );
}
