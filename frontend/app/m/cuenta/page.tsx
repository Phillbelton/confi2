'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientAuth } from '@/hooks/client/useClientAuth';

const links = [
  {
    href: '/perfil',
    title: 'Perfil',
    description: 'Datos personales y contraseña',
    icon: User,
  },
  {
    href: '/mis-ordenes',
    title: 'Mis pedidos',
    description: 'Historial y seguimiento',
    icon: Package,
  },
  {
    href: '/direcciones',
    title: 'Direcciones',
    description: 'Gestionar entregas',
    icon: MapPin,
  },
];

export default function CuentaPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useClientAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="px-4 py-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Mi cuenta
        </p>
        <h1 className="text-2xl font-semibold leading-tight">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </header>

      <nav className="space-y-2">
        {links.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="block">
            <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent active:bg-accent">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </nav>

      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
