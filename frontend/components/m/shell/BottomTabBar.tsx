'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStoreM } from '@/store/m/useCartStoreM';

const TABS = [
  { href: '/', icon: Home, label: 'Inicio', match: (p: string) => p === '/' },
  {
    href: '/productos',
    icon: LayoutGrid,
    label: 'Catálogo',
    match: (p: string) => p.startsWith('/productos'),
  },
  {
    href: '/carrito',
    icon: ShoppingBag,
    label: 'Carrito',
    match: (p: string) => p.startsWith('/carrito'),
    showBadge: true,
  },
  {
    href: '/perfil',
    icon: User,
    label: 'Perfil',
    match: (p: string) => p.startsWith('/perfil'),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const itemCount = useCartStoreM((s) => s.itemCount);

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur',
        'pb-[env(safe-area-inset-bottom)] lg:hidden'
      )}
      aria-label="Navegación principal"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  'tappable flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className={cn('h-6 w-6', active && 'fill-primary/10')} strokeWidth={active ? 2.4 : 2} />
                  {tab.showBadge && itemCount > 0 && (
                    <span
                      className={cn(
                        'absolute -right-2 -top-1 min-w-[18px] rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-accent-foreground',
                        'shadow-sm'
                      )}
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-tight">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

