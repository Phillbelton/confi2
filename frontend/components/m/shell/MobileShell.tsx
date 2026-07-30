'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { StickyHeader } from './StickyHeader';
import { CartFab } from './CartFab';
import { MobileFooter } from './MobileFooter';
import { isProductDetailPath } from '@/lib/utils';

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
  const pathname = usePathname();
  return (
    <div className="theme-catalog flex min-h-dvh flex-col overflow-x-clip bg-background">
      {!hideHeader && <StickyHeader />}

      <main className="flex-1 pb-[env(safe-area-inset-bottom)]">
        {/*
         * Gutter lateral del contenido. Header y footer siguen full-bleed; solo
         * el cuerpo gana márgenes que crecen con el ancho para que en los anchos
         * de laptop más comunes (1366/1440/1536) el contenido deje de llegar
         * borde a borde. Las secciones full-bleed (100vw) ignoran este padding.
         */}
        <div className="mx-auto w-full max-w-screen-md md:max-w-[max(1440px,70vw)] md:px-6 lg:px-10 xl:px-12 2xl:px-20">
          {children}
        </div>
        {!hideFooter && (
          <MobileFooter stickyBarClearance={isProductDetailPath(pathname)} />
        )}
      </main>

      {!hideFab && <CartFab />}
    </div>
  );
}
