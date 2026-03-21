'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Agrega .theme-admin al <body> para que los portales de Radix UI
  // (Dialog, Popover, Tooltip) hereden las variables CSS del tema admin
  useEffect(() => {
    if (!isLoginPage) {
      document.body.classList.add('theme-admin');
      return () => document.body.classList.remove('theme-admin');
    }
  }, [isLoginPage]);

  // Login page doesn't need protection or layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protected admin pages with sidebar and header
  return (
    <ProtectedRoute>
      <TooltipProvider delayDuration={200}>
        <div className="theme-admin min-h-screen bg-background text-foreground">
          <AdminSidebar />

          <div className="md:pl-64 transition-all duration-300">
            <AdminHeader />

            <main className="p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ProtectedRoute>
  );
}
