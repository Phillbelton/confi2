import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { businessWhatsappHref } from '@/lib/whatsapp';

/**
 * Shell común para las páginas de la sección "Ayuda" (Cómo comprar, Formas de
 * pago, Envíos y retiros): título, contenido y un CTA de WhatsApp al pie.
 */
export function AyudaPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      <h1 className="font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
        {title}
      </h1>
      {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}

      <div className="mt-7 space-y-5">{children}</div>

      <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          ¿Te quedan dudas o quieres cotizar por mayor?
        </p>
        <Link
          href={businessWhatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          Escríbenos por WhatsApp
        </Link>
      </div>
    </div>
  );
}
