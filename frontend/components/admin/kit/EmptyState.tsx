'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Qué falta, en los términos del usuario ("Todavía no hay colecciones"). */
  title: string;
  /** Para qué sirve esto y cómo empezar. */
  description?: string;
  /** Siempre ofrecer una salida: crear, importar, limpiar filtros. */
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vacío accionable. Nunca dejar un "No hay datos" sin próximo paso.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <div className="rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
