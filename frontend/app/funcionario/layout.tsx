'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { FuncionarioSidebar } from '@/components/funcionario/layout/FuncionarioSidebar';
import { FuncionarioHeader } from '@/components/funcionario/layout/FuncionarioHeader';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function FuncionarioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Protected funcionario pages with sidebar and header
  return (
    <ProtectedRoute allowedRoles={['admin', 'funcionario']}>
      <TooltipProvider delayDuration={200}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <FuncionarioSidebar />

          <div className="md:pl-64 transition-all duration-300">
            <FuncionarioHeader />

            <main className="p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ProtectedRoute>
  );
}
