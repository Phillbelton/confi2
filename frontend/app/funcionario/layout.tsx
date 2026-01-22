'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FuncionarioProtectedRoute } from '@/components/funcionario/auth/FuncionarioProtectedRoute';
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
  const isLoginPage = pathname === '/funcionario/login';

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

  // Login page doesn't need protection or layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protected funcionario pages with sidebar and header
  // Tema oscuro forzado para funcionarios internos
  return (
    <FuncionarioProtectedRoute>
      <TooltipProvider delayDuration={200}>
        <div className="theme-funcionario min-h-screen bg-background text-foreground">
          <FuncionarioSidebar />

          <div className="md:pl-64">
            <FuncionarioHeader onSearchClick={() => setCommandPaletteOpen(true)} />

            <main className="px-2 py-4 sm:px-4 md:px-8 md:py-6 lg:px-10">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>

          {/* Command Palette (Ctrl+K) */}
          <CommandPalette
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
          />
        </div>
      </TooltipProvider>
    </FuncionarioProtectedRoute>
  );
}
