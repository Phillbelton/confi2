'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartCheckoutBarProps {
  total: number;
  itemCount: number;
  href?: string;
}

export function CartCheckoutBar({
  total,
  itemCount,
  href = '/checkout',
}: CartCheckoutBarProps) {
  if (itemCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden',
        'bottom-[calc(64px+env(safe-area-inset-bottom))]'
      )}
    >
      <div className="mx-auto flex w-full max-w-screen-md items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:max-w-[1440px] lg:px-8 lg:pb-3">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Total
          </span>
          <span className="text-lg font-bold tabular-nums">
            ${Math.round(total).toLocaleString('es-CL')}
          </span>
        </div>

        <Link
          href={href}
          className={cn(
            'tappable inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-all',
            'hover:bg-primary/90 active:scale-[0.98]'
          )}
        >
          Ir a pagar
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
