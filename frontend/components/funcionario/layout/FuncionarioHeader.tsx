'use client';

import { Bell, Menu, Search, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useFuncionarioStore } from '@/store/useFuncionarioStore';
import { useRouter } from 'next/navigation';

interface FuncionarioHeaderProps {
  onSearchClick?: () => void;
}

export function FuncionarioHeader({ onSearchClick }: FuncionarioHeaderProps = {}) {
  const { user, toggleSidebar, logout } = useFuncionarioStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // TODO: Implementar notificaciones reales
  const notificationCount = 3;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left side - Mobile menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="relative hidden md:block max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar orden, cliente... (Ctrl+K)"
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 cursor-pointer"
              readOnly
              onClick={onSearchClick}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
          </div>
        </div>

        {/* Right side - Notifications + User menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="py-2 px-2 space-y-2">
                <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Nueva orden QUE-015</p>
                      <p className="text-xs text-slate-500">Juan Pérez • hace 2 min</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Orden QUE-012 pendiente 2h</p>
                      <p className="text-xs text-slate-500">María López • hace 2h</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Orden QUE-010 completada</p>
                      <p className="text-xs text-slate-500">Carlos Sosa • hace 15 min</p>
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Ver todas las notificaciones
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'F'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.name || 'Funcionario'}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role || 'funcionario'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/funcionario/perfil')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
