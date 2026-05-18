'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/hooks/client/useClientAuth';
import { useOrderNotifications } from '@/hooks/client/useOrderNotifications';
import { MobileShell } from '@/components/m/shell/MobileShell';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useClientAuth();
  useOrderNotifications();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

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

  return (
    <MobileShell>
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </div>
    </MobileShell>
  );
}
