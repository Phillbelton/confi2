'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  /** Sin href = es la página actual (último tramo). */
  href?: string;
}

interface PageHeaderProps {
  title: string;
  /** Bajada corta. Explica qué se hace acá, no repite el título. */
  description?: string;
  /** Tramos previos; el título se agrega solo como tramo final. */
  breadcrumbs?: Crumb[];
  /** Acciones primarias, alineadas a la derecha en desktop. */
  actions?: ReactNode;
  /** Dato al lado del título (ej. "1.439 en el catálogo"). */
  meta?: ReactNode;
  className?: string;
}

/**
 * Encabezado único de las vistas del admin: breadcrumb + título + acciones.
 * Reemplaza el "Panel de Administración" hardcodeado del header viejo.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3', className)} data-testid="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {/* El separador es hermano del item, no hijo: ambos son <li> y
                anidarlos rompe la hidratación. */}
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${crumb.href ?? 'current'}`}>
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1
              className="text-2xl md:text-[1.75rem] font-bold tracking-tight"
              data-testid="page-title"
            >
              {title}
            </h1>
            {meta && (
              <span className="text-sm text-muted-foreground tabular-nums">{meta}</span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-prose">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2" data-testid="page-actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
