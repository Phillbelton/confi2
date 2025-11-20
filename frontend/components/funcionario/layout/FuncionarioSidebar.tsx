'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  User,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFuncionarioStore } from '@/store/useFuncionarioStore';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/funcionario',
    icon: LayoutDashboard,
  },
  {
    title: 'Órdenes',
    href: '/funcionario/ordenes',
    icon: ShoppingCart,
  },
  {
    title: 'Pendientes',
    href: '/funcionario/ordenes/pendientes',
    icon: ClipboardList,
  },
  {
    title: 'Estadísticas',
    href: '/funcionario/estadisticas',
    icon: BarChart3,
  },
  {
    title: 'Perfil',
    href: '/funcionario/perfil',
    icon: User,
  },
];

export function FuncionarioSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useFuncionarioStore();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
          sidebarOpen ? 'w-64' : 'w-0 md:w-16'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            {sidebarOpen && (
              <Link href="/funcionario" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base leading-tight">Quelita</span>
                  <span className="text-xs text-slate-500">Funcionario</span>
                </div>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn(
                'hidden md:flex',
                !sidebarOpen && 'mx-auto'
              )}
            >
              <ChevronLeft
                className={cn(
                  'h-4 w-4 transition-transform',
                  !sidebarOpen && 'rotate-180'
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/funcionario' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-slate-100 dark:hover:bg-slate-800',
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-slate-700 dark:text-slate-300',
                      !sidebarOpen && 'justify-center'
                    )}
                    title={!sidebarOpen ? item.title : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          {sidebarOpen && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 text-center">
                Vista del Funcionario
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
