'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAdminStore } from '@/store/useAdminStore';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const { sidebarOpen, toggleSidebar } = useAdminStore();

  // Agrega .theme-admin al <body> para que los portales de Radix UI
  // (Dialog, Popover, Tooltip) hereden las variables CSS del tema admin
  useEffect(() => {
    if (!isLoginPage) {
      document.body.classList.add('theme-admin');
      return () => document.body.classList.remove('theme-admin');
    }
  }, [isLoginPage]);

  // Atajo "[" para colapsar/expandir el sidebar (más espacio de trabajo).
  // Se ignora cuando el foco está en un campo de texto.
  useEffect(() => {
    if (isLoginPage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      ) {
        return;
      }
      toggleSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLoginPage, toggleSidebar]);

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

          {/* El padding sigue al estado del sidebar: colapsado (rail de iconos,
              w-16) el contenido recupera el ancho. Antes era md:pl-64 fijo. */}
          <div
            className={cn(
              'transition-all duration-300',
              sidebarOpen ? 'md:pl-64' : 'md:pl-16'
            )}
          >
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
