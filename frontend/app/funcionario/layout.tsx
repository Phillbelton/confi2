'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { FuncionarioSidebar } from '@/components/funcionario/layout/FuncionarioSidebar';
import { FuncionarioHeader } from '@/components/funcionario/layout/FuncionarioHeader';
import { CommandPalette } from '@/components/funcionario/CommandPalette';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function FuncionarioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Protected funcionario pages with sidebar and header
  return (
    <ProtectedRoute allowedRoles={['admin', 'funcionario']}>
      <TooltipProvider delayDuration={200}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <FuncionarioSidebar />

          <div className="md:pl-64 transition-all duration-300">
            <FuncionarioHeader onSearchClick={() => setCommandPaletteOpen(true)} />

            <main className="p-4 md:p-6">
              {children}
            </main>
          </div>

          {/* Command Palette (Ctrl+K) */}
          <CommandPalette
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
          />
        </div>
      </TooltipProvider>
    </ProtectedRoute>
  );
}
