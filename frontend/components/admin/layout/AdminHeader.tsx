'use client';

import Link from 'next/link';
import { Menu, LogOut, Search, Sun, Moon, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminStore } from '@/store/useAdminStore';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useCommandPalette } from './CommandPalette';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  funcionario: 'Funcionario',
  cliente: 'Cliente',
};

export function AdminHeader() {
  const { toggleMobileNav, user, theme, toggleTheme } = useAdminStore();
  const { logout, isLoggingOut } = useAdminAuth();
  const openPalette = useCommandPalette((s) => s.setOpen);

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AD';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-card px-3 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileNav}
        className="md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Buscador global: en desktop se ve como campo, en móvil como icono */}
      <button
        type="button"
        onClick={() => openPalette(true)}
        data-testid="open-command-palette"
        className="hidden md:flex min-w-[260px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50"
      >
        <Search className="h-4 w-4" />
        <span>Buscar producto o pedido…</span>
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openPalette(true)}
        className="md:hidden"
        aria-label="Buscar"
      >
        <Search className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              data-testid="toggle-theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Tema {theme === 'dark' ? 'claro' : 'oscuro'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/" target="_blank" aria-label="Ver la tienda">
                <Store className="h-[18px] w-[18px]" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver la tienda</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-tight">{user?.name}</span>
                <span className="block text-xs leading-tight text-muted-foreground">
                  {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-sm font-medium">{user?.name}</span>
              <span className="block text-xs text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
