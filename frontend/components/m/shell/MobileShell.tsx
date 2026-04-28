'use client';

import { type ReactNode } from 'react';
import { StickyHeader } from './StickyHeader';
import { BottomTabBar, SideRail } from './BottomTabBar';
import { CartFab } from './CartFab';
import { MobileFooter } from './MobileFooter';
import { cn } from '@/lib/utils';

interface MobileShellProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFab?: boolean;
  hideFooter?: boolean;
}

export function MobileShell({
  children,
  hideHeader,
  hideFab,
  hideFooter,
}: MobileShellProps) {
  return (
    <div className="theme-catalog min-h-dvh overflow-x-clip bg-background lg:pl-20">
      <SideRail />

      <div className="mx-auto flex min-h-dvh w-full max-w-screen-md flex-col">
        {!hideHeader && <StickyHeader />}

        <main
          className={cn(
            'flex-1 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-12'
          )}
        >
          {children}
          {!hideFooter && <MobileFooter />}
        </main>
      </div>

      {!hideFab && <CartFab />}
      <BottomTabBar />
    </div>
  );
}
