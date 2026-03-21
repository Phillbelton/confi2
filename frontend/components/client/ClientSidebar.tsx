'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useClientStore } from '@/store/useClientStore';
import { useClientLogout } from '@/hooks/client/useClientAuth';
import { cn } from '@/lib/utils';

const sidebarNavItems = [
  {
    title: 'Mi Perfil',
    href: '/perfil',
    icon: User,
    description: 'Datos personales y configuración',
  },
  {
    title: 'Mis Pedidos',
    href: '/mis-ordenes',
    icon: Package,
    description: 'Historial y seguimiento',
  },
  {
    title: 'Mis Direcciones',
    href: '/direcciones',
    icon: MapPin,
    description: 'Direcciones de entrega',
  },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const { user } = useClientStore();
  const logoutMutation = useClientLogout();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[280px] lg:fixed lg:inset-y-0 lg:top-14 lg:border-r bg-background">
      {/* User Info */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
              {user ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user?.name || 'Usuario'}</p>
            <p className="text-sm text-muted-foreground truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarNavItems.map(({ title, href, icon: Icon, description }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  isActive ? 'bg-primary/20' : 'bg-muted group-hover:bg-background'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {description}
                </p>
              </div>
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isActive && 'text-primary'
                )}
              />
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

export default ClientSidebar;
