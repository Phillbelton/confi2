'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Grid,
  Package,
  User,
  MapPin,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClientStore } from '@/store/useClientStore';
import { useClientLogout } from '@/hooks/client/useClientAuth';
import { cn } from '@/lib/utils';

interface ClientMobileNavProps {
  onClose: () => void;
}

const publicNavItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/productos', icon: Grid, label: 'Productos' },
];

const authNavItems = [
  { href: '/perfil', icon: User, label: 'Mi Perfil' },
  { href: '/mis-ordenes', icon: Package, label: 'Mis Pedidos' },
  { href: '/direcciones', icon: MapPin, label: 'Mis Direcciones' },
];

export function ClientMobileNav({ onClose }: ClientMobileNavProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useClientStore();
  const logoutMutation = useClientLogout();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Bienvenido</p>
              <p className="text-sm text-muted-foreground">Inicia sesión para más</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Public Items */}
        <div className="px-3 space-y-1">
          {publicNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>

        {isAuthenticated && (
          <>
            <Separator className="my-4" />

            {/* Auth Items */}
            <div className="px-3 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mi cuenta
              </p>
              {authNavItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Footer Actions */}
      <div className="border-t p-4 space-y-2">
        {isAuthenticated ? (
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar sesión
          </Button>
        ) : (
          <>
            <Button variant="default" className="w-full" asChild>
              <Link href="/login" onClick={onClose}>
                <LogIn className="h-5 w-5 mr-2" />
                Iniciar sesión
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/registro" onClick={onClose}>
                <UserPlus className="h-5 w-5 mr-2" />
                Crear cuenta
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default ClientMobileNav;
