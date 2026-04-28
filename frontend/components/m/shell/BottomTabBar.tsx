'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStoreM } from '@/store/m/useCartStoreM';

const TABS = [
  { href: '/m', icon: Home, label: 'Inicio', match: (p: string) => p === '/m' },
  {
    href: '/m/productos',
    icon: LayoutGrid,
    label: 'Catálogo',
    match: (p: string) => p.startsWith('/m/productos'),
  },
  {
    href: '/m/carrito',
    icon: ShoppingBag,
    label: 'Carrito',
    match: (p: string) => p.startsWith('/m/carrito'),
    showBadge: true,
  },
  {
    href: '/m/cuenta',
    icon: User,
    label: 'Cuenta',
    match: (p: string) => p.startsWith('/m/cuenta'),
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

export function SideRail() {
  const pathname = usePathname();
  const itemCount = useCartStoreM((s) => s.itemCount);

  return (
    <nav
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 hidden w-20 flex-col items-center justify-between border-r border-border bg-background py-6',
        'lg:flex'
      )}
      aria-label="Navegación principal"
    >
      <Link href="/m" className="flex flex-col items-center gap-1 text-primary font-display font-bold">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground text-lg shadow-lg">
          Q
        </span>
      </Link>

      <ul className="flex flex-col gap-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  'tappable flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                  {tab.showBadge && itemCount > 0 && (
                    <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-accent-foreground">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="h-2 w-2 rounded-full bg-primary/30" aria-hidden />
    </nav>
  );
}
