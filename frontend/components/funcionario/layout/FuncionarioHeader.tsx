'use client';

import { Menu, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFuncionarioStore } from '@/store/useFuncionarioStore';
import { useFuncionarioAuth } from '@/hooks/funcionario/useFuncionarioAuth';

interface FuncionarioHeaderProps {
  onSearchClick?: () => void;
}

export function FuncionarioHeader({ onSearchClick }: FuncionarioHeaderProps = {}) {
  const { user, toggleSidebar } = useFuncionarioStore();
  const { logout } = useFuncionarioAuth();

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

        {/* Right side - User menu */}
        <div className="flex items-center gap-2">
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
              <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
