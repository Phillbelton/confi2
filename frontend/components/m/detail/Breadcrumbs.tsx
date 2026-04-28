'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string; // ausente => no clickeable (último eslabón)
  emoji?: string;
  current?: boolean; // marca aria-current="page"
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs mobile-first con scroll-x + snap.
 * - Primer eslabón: icono Home siempre.
 * - Separador: chevron `›`.
 * - Último eslabón: aria-current="page", sin link, color tenue.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Ruta de navegación"
      className={cn(
        'snap-x-mandatory overflow-x-auto scrollbar-none scroll-pl-safe scroll-pr-safe',
        className
      )}
    >
      <ol className="flex w-max items-center gap-1 px-4 py-2 text-xs">
        {/* Inicio fijo al principio */}
        <li className="snap-start">
          <Link
            href="/m"
            aria-label="Inicio"
            className="tappable inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1.5 font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>

        {items.map((item, idx) => (
          <li
            key={`${item.label}-${idx}`}
            className="flex items-center gap-1 snap-start"
          >
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
              aria-hidden
            />
            {item.href && !item.current ? (
              <Link
                href={item.href}
                className="tappable inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1.5 font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {item.emoji && (
                  <span className="text-sm" aria-hidden>
                    {item.emoji}
                  </span>
                )}
                <span className="line-clamp-1 max-w-[180px]">{item.label}</span>
              </Link>
            ) : (
              <span
                aria-current={item.current ? 'page' : undefined}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 font-semibold text-muted-foreground"
              >
                {item.emoji && (
                  <span className="text-sm" aria-hidden>
                    {item.emoji}
                  </span>
                )}
                <span className="line-clamp-1 max-w-[200px]">{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
