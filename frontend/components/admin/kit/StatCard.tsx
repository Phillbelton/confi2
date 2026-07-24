'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** Estado semántico del KPI. `default` usa el acento; el resto, color de estado. */
export type StatTone = 'default' | 'ok' | 'warn' | 'crit' | 'info' | 'neutral';

const TONE_VALUE: Record<StatTone, string> = {
  default: 'text-foreground',
  neutral: 'text-foreground',
  ok: 'text-admin-ok',
  warn: 'text-admin-warn',
  crit: 'text-admin-crit',
  info: 'text-admin-info',
};

const TONE_STRIPE: Record<StatTone, string> = {
  default: 'bg-primary',
  neutral: 'bg-border',
  ok: 'bg-admin-ok',
  warn: 'bg-admin-warn',
  crit: 'bg-admin-crit',
  info: 'bg-admin-info',
};

interface StatCardProps {
  label: string;
  value: string | number;
  /** Aclaración bajo el número (ej. "por confirmar"). */
  caption?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Si se pasa, la tarjeta se vuelve un botón (patrón: filtrar la tabla). */
  onClick?: () => void;
  /** Marca el KPI como filtro activo. */
  selected?: boolean;
  loading?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * KPI del panel. Clicable filtra la tabla de abajo (patrón de las vistas v2).
 * El estado se codifica por color Y por la barra lateral, no solo por color.
 */
export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = 'default',
  onClick,
  selected = false,
  loading = false,
  className,
  'data-testid': testId,
}: StatCardProps) {
  if (loading) {
    return <Skeleton className={cn('h-[88px] rounded-xl', className)} />;
  }

  const interactive = typeof onClick === 'function';
  const Comp = interactive ? 'button' : 'div';

  return (
    <Comp
      {...(interactive
        ? { type: 'button' as const, onClick, 'aria-pressed': selected }
        : {})}
      data-testid={testId ?? 'stat-card'}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-4 text-left',
        'transition-colors',
        interactive && 'hover:border-primary/60 cursor-pointer',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border',
        className
      )}
    >
      <span
        aria-hidden
        className={cn('absolute inset-y-0 left-0 w-1', TONE_STRIPE[tone])}
      />

      <div className="flex items-center gap-2 pl-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>

      <p
        className={cn(
          'pl-1 mt-1 text-2xl font-bold tabular-nums tracking-tight',
          TONE_VALUE[tone]
        )}
      >
        {typeof value === 'number' ? value.toLocaleString('es-CL') : value}
      </p>

      {caption && <p className="pl-1 text-xs text-muted-foreground">{caption}</p>}
    </Comp>
  );
}
