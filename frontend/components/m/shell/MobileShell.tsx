'use client';

import { type ReactNode } from 'react';
import { StickyHeader } from './StickyHeader';
import { BottomTabBar } from './BottomTabBar';
import { CartFab } from './CartFab';
import { MobileFooter } from './MobileFooter';
import { cn } from '@/lib/utils';

interface MobileShellProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFab?: boolean;
  hideFooter?: boolean;
  /**
   * Oculta la barra de navegación inferior (BottomTabBar). Usar en páginas
   * que tienen su propia sticky CTA bar mobile (ej. /checkout) para evitar
   * que ambas peleen por el bottom del viewport.
   * Cuando está activo también remueve el padding bottom que reservaba el
   * espacio para la tab bar (la página maneja su propio espaciado).
   */
  hideTabBar?: boolean;
}

/**
 * Shell del frontend público.
 *
 * Header y footer ocupan el ancho completo del viewport (full-bleed); el
 * contenido se capea a max-w-screen-md (mobile/tablet) y max-w-[1440px] (desktop)
 * con contenedores internos. Así las bandas de color cubren toda la pantalla
 * aunque se aleje el zoom o en monitores ultra-anchos.
 */
export function MobileShell({
  children,
  hideHeader,
  hideFab,
  hideFooter,
  hideTabBar,
}: MobileShellProps) {
  return (
    <div className="theme-catalog flex min-h-dvh flex-col overflow-x-clip bg-background">
      {!hideHeader && <StickyHeader />}

      <main
        className={cn(
          'flex-1',
          hideTabBar
            ? 'pb-0'
            : 'pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-12'
        )}
      >
        <div className="mx-auto w-full max-w-screen-md lg:max-w-[1440px]">
          {children}
        </div>
        {!hideFooter && <MobileFooter />}
      </main>

      {!hideFab && <CartFab />}
      {!hideTabBar && <BottomTabBar />}
    </div>
  );
}
