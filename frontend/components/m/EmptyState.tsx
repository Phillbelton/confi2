import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Emoji decorativo con personalidad de marca. Tiene prioridad sobre `icon`. */
  emoji?: string;
  /** Icono lucide alternativo si no se usa emoji. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  /** CTA secundario opcional (estilo outline). */
  secondaryAction?: { label: string; href: string };
  className?: string;
}

/**
 * Empty state con personalidad de confitería: badge tipo sticker, halo de color
 * y CTA redondeado. Usado en carrito vacío, búsquedas sin resultados, etc.
 */
export function EmptyState({
  emoji,
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 px-6 py-16 text-center lg:py-24',
        className
      )}
    >
      {/* Halo decorativo */}
      <div
        className="pointer-events-none absolute left-1/2 top-10 h-44 w-44 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl lg:top-14"
        aria-hidden
      />

      <div className="sticker-badge relative grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 ring-1 ring-primary/20 lg:h-28 lg:w-28">
        {emoji ? (
          <span className="text-5xl lg:text-6xl" aria-hidden>
            {emoji}
          </span>
        ) : Icon ? (
          <Icon className="h-11 w-11 text-primary lg:h-12 lg:w-12" />
        ) : null}
      </div>

      <h2 className="relative font-display text-xl font-bold text-foreground lg:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="relative max-w-sm text-sm text-muted-foreground lg:max-w-md lg:text-base">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="relative mt-2 flex flex-wrap items-center justify-center gap-2.5">
          {action && (
            <Link
              href={action.href}
              className="tappable inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-[1.03] active:scale-95 lg:text-base"
            >
              {action.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="tappable inline-flex items-center justify-center rounded-full border-2 border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 lg:text-base"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
