'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/client/ClientHeader';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { ClientBottomNav } from '@/components/client/ClientBottomNav';
import { useClientAuth } from '@/hooks/client/useClientAuth';
import { useOrderNotifications } from '@/hooks/client/useOrderNotifications';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useClientAuth();

  // Monitor order status changes for notifications
  useOrderNotifications();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="sticky top-0 z-50 h-14 bg-background border-b">
          <div className="container h-full flex items-center justify-between px-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (se redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      <div className="flex">
        {/* Sidebar - Solo desktop */}
        <ClientSidebar />

        {/* Contenido principal */}
        <main className="flex-1 min-h-[calc(100vh-56px)] pb-20 lg:pb-0 lg:ml-[280px]">
          <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 max-w-4xl">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav - Solo mobile */}
      <ClientBottomNav />
    </div>
  );
}
