import type { ReactNode } from 'react';

/**
 * Sección numerada de las páginas legales. Texto corrido en vez de tarjetas:
 * son documentos largos que se leen de arriba a abajo, no listas de opciones.
 */
export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold tracking-tight">
        {n}. {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
