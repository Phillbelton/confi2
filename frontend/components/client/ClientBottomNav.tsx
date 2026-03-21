'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Package, User } from 'lucide-react';
import { useClientStore } from '@/store/useClientStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/productos', icon: Grid, label: 'Productos' },
  { href: '/mis-ordenes', icon: Package, label: 'Pedidos', requiresAuth: true },
  { href: '/perfil', icon: User, label: 'Perfil', requiresAuth: true },
];

export function ClientBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useClientStore();

  // Filtrar items que requieren auth si el usuario no está autenticado
  const visibleItems = navItems.map((item) => {
    if (item.requiresAuth && !isAuthenticated) {
      // Redirigir a login si no está autenticado
      return { ...item, href: '/login' };
    }
    return item;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || (href !== '/' && pathname.startsWith(href));

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-1',
                'transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5 flex-shrink-0', isActive && 'fill-primary/20')}
              />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default ClientBottomNav;
