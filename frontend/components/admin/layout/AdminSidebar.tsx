'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  FolderTree,
  Tags,
  Users,
  FileText,
  Activity,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminStore } from '@/store/useAdminStore';

type UserRole = 'admin' | 'funcionario' | 'cliente';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['admin', 'funcionario'] as UserRole[],
  },
  {
    title: 'Productos',
    href: '/admin/productos',
    icon: Package,
    roles: ['admin', 'funcionario'] as UserRole[],
  },
  {
    title: 'Órdenes',
    href: '/admin/ordenes',
    icon: ShoppingCart,
    roles: ['admin'] as UserRole[], // Solo admin
  },
  {
    title: 'Inventario',
    href: '/admin/inventario',
    icon: Warehouse,
    roles: ['admin', 'funcionario'] as UserRole[],
  },
  {
    title: 'Categorías',
    href: '/admin/categorias',
    icon: FolderTree,
    roles: ['admin'] as UserRole[], // Solo admin
  },
  {
    title: 'Marcas',
    href: '/admin/marcas',
    icon: Tags,
    roles: ['admin'] as UserRole[], // Solo admin
  },
  {
    title: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['admin'] as UserRole[], // Solo admin
  },
  {
    title: 'Reportes',
    href: '/admin/reportes',
    icon: FileText,
    roles: ['admin'] as UserRole[], // Solo admin
  },
  {
    title: 'Auditoría',
    href: '/admin/auditoria',
    icon: Activity,
    roles: ['admin'] as UserRole[], // Solo admin
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, user } = useAdminStore();

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) =>
    user?.role ? item.roles.includes(user.role as UserRole) : false
  );

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
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CQ</span>
                </div>
                <span className="font-semibold text-lg">Admin Panel</span>
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
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-slate-100 dark:hover:bg-slate-800',
                      isActive
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
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
