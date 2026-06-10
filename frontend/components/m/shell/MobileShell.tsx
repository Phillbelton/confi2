'use client';

import { type ReactNode } from 'react';
import { StickyHeader } from './StickyHeader';
import { CartFab } from './CartFab';
import { MobileFooter } from './MobileFooter';

interface MobileShellProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFab?: boolean;
  hideFooter?: boolean;
}

/**
 * Shell del frontend público.
 *
 * Header y footer ocupan el ancho completo del viewport (full-bleed); el
 * contenido se capea a max-w-screen-md (mobile/tablet) y max-w-[1440px] (desktop)
 * con contenedores internos. Así las bandas de color cubren toda la pantalla
 * aunque se aleje el zoom o en monitores ultra-anchos.
 *
 * La navegación mobile vive en el StickyHeader (hamburguesa + carrito + cuenta);
 * no hay tab bar inferior, así el footer cierra la página sin franjas vacías.
 */
export function MobileShell({
  children,
  hideHeader,
  hideFab,
  hideFooter,
}: MobileShellProps) {
  return (
    <div className="theme-catalog flex min-h-dvh flex-col overflow-x-clip bg-background">
      {!hideHeader && <StickyHeader />}

      <main className="flex-1 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-screen-md lg:max-w-[1440px]">
          {children}
        </div>
        {!hideFooter && <MobileFooter />}
      </main>

      {!hideFab && <CartFab />}
    </div>
  );
}
