import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, Phone } from 'lucide-react';
import { businessWhatsappHref, formatBusinessWhatsapp } from '@/lib/whatsapp';

export const metadata = {
  title: 'Mi cuenta · Confitería Quelita',
  description: 'Ingresá o creá tu cuenta para seguir tus pedidos en Confitería Quelita.',
};

/**
 * Shell de las páginas de autenticación (login, registro, recuperar/restablecer
 * contraseña). Reusa el lenguaje visual de la tienda — gradiente candy turquesa
 * → petróleo, fondo crema, acentos magenta — con un header de marca acotado (sin
 * buscador/carrito/categorías, para no distraer del formulario) y un footer slim
 * de confianza. El tema `theme-catalog` aplica la paleta cálida del storefront.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="theme-catalog flex min-h-dvh flex-col overflow-x-clip bg-background">
      {/* ============================ Header de marca ============================ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary candy-bg text-primary-foreground shadow-md">
        {/* Decoración blobs (mismos del StickyHeader) */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-accent/30 blur-2xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-screen-md items-center px-4 py-3 lg:max-w-[1440px] lg:px-8">
          <Link
            href="/"
            className="tappable inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            aria-label="Volver a la tienda"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Volver a la tienda</span>
          </Link>

          <Link
            href="/"
            className="absolute left-1/2 flex -translate-x-1/2 items-center"
            aria-label="Inicio Quelita"
          >
            <Image
              src="/brand/logo.png"
              alt="Confitería Quelita"
              width={120}
              height={78}
              priority
              className="h-9 w-auto drop-shadow-md"
            />
          </Link>
        </div>

        {/* Remate inferior: hilo candy que ancla el header al fondo crema */}
        <div
          className="relative z-10 h-[3px] bg-gradient-to-r from-accent via-secondary to-accent"
          aria-hidden
        />
      </header>

      {/* ============================ Contenido ============================ */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* ============================ Footer slim ============================ */}
      <footer className="relative overflow-hidden bg-gradient-to-b from-secondary to-secondary/95 candy-bg text-white">
        <div className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-primary/25 blur-3xl" aria-hidden />
        <div className="relative z-10 mx-auto flex w-full max-w-screen-md flex-col items-center gap-3 px-4 py-6 text-center lg:max-w-[1440px] lg:flex-row lg:justify-between lg:gap-4 lg:px-8 lg:text-left">
          <p className="font-display text-xs font-bold uppercase tracking-widest opacity-80">
            Confitería Quelita · Desde 1995
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/80">
            <Link href="/ayuda/como-comprar" className="hover:text-white transition-colors">
              Cómo comprar
            </Link>
            <Link href="/productos" className="hover:text-white transition-colors">
              Catálogo
            </Link>
            <Link
              href={businessWhatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4" />
              {formatBusinessWhatsapp()}
            </Link>
          </nav>

          <p className="inline-flex items-center gap-1.5 text-[11px] text-white/60">
            Hecho con
            <Heart className="h-3 w-3 fill-accent text-accent" />
            en Chile
            <span className="text-white/30">·</span>© {year}
          </p>
        </div>
      </footer>
    </div>
  );
}
