'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from 'lucide-react';

const TRUST_BADGES = [
  { icon: Truck, label: 'Envío rápido', sub: 'Todo Chile' },
  { icon: ShieldCheck, label: 'Compra segura', sub: 'Datos protegidos' },
  { icon: Wallet, label: 'Pagá fácil', sub: 'Efectivo o tarjeta' },
];

const LINKS = {
  comprar: [
    { label: 'Catálogo completo', href: '/m/productos' },
    { label: 'Ofertas', href: '/m/productos?onSale=true' },
    { label: 'Destacados', href: '/m/productos?featured=true' },
    { label: 'Novedades', href: '/m/productos?sort=newest' },
  ],
  ayuda: [
    { label: 'Cómo comprar', href: '/ayuda/como-comprar' },
    { label: 'Formas de pago', href: '/ayuda/formas-de-pago' },
    { label: 'Envíos y retiros', href: '/ayuda/envios' },
    { label: 'Preguntas frecuentes', href: '/ayuda/faq' },
  ],
};

export function MobileFooter() {
  return (
    <footer className="relative mt-6 overflow-hidden">
      {/* Wave divider */}
      <svg
        className="block w-full text-secondary"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 20 Q 150 0 300 18 T 600 14 T 900 20 T 1200 12 V 40 H 0 Z"
          fill="currentColor"
        />
      </svg>

      <div className="relative bg-gradient-to-b from-secondary via-secondary to-secondary/95 candy-bg text-white">
        {/* Blobs decorativos */}
        <div className="pointer-events-none absolute -right-12 top-12 h-48 w-48 rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />

        {/* CTA newsletter / contacto */}
        <section className="relative px-4 pt-8 lg:px-8">
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur ring-1 ring-white/15">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground shadow-md">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold leading-tight">
                  Hablemos por WhatsApp
                </h3>
                <p className="mt-0.5 text-xs text-white/70">
                  Pedí asesoría, cotizaciones por mayor o reservá tu pedido.
                </p>
              </div>
            </div>
            <Link
              href="https://wa.me/56964269246"
              target="_blank"
              rel="noopener noreferrer"
              className="tappable mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-bold text-secondary shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <Phone className="h-4 w-4" />
              Escribir ahora
            </Link>
          </div>
        </section>

        {/* Trust badges */}
        <section className="relative px-4 pt-6 lg:px-8">
          <ul className="grid grid-cols-3 gap-2 text-center">
            {TRUST_BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.label}
                  className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
                >
                  <span className="grid h-9 w-9 mx-auto place-items-center rounded-full bg-primary/20 text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-1.5 text-[11px] font-bold leading-tight">
                    {b.label}
                  </p>
                  <p className="text-[10px] text-white/60 leading-tight">{b.sub}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Brand block */}
        <section className="relative px-4 pt-8 lg:px-8">
          <div className="flex items-start gap-3">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/15 p-2 ring-1 ring-white/30 backdrop-blur">
              <Image
                src="/brand/logo.png"
                alt="Confitería Quelita"
                width={96}
                height={96}
                className="h-12 w-auto drop-shadow-md"
              />
            </span>
            <div>
              <p className="font-handwriting text-2xl text-white leading-none">
                Endulzando con cariño
              </p>
              <p className="font-display text-xs font-bold uppercase tracking-widest opacity-80">
                Confitería Quelita · Desde 1995
              </p>
              <p className="mt-1 text-xs text-white/70">
                Mayorista y detalle. Caramelos, chocolates, bebidas, snacks y más.
              </p>
            </div>
          </div>

          {/* Social */}
          <div className="mt-5 flex gap-2.5">
            <Link
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="tappable grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white transition-all hover:bg-primary hover:scale-105"
            >
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="tappable grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white transition-all hover:bg-accent hover:scale-105"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:info@quelita.com"
              aria-label="Email"
              className="tappable grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white transition-all hover:bg-primary hover:scale-105"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Links */}
        <section className="relative grid grid-cols-2 gap-4 px-4 pt-7 lg:grid-cols-3 lg:px-8">
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Comprar
            </h4>
            <ul className="mt-2 space-y-1.5">
              {LINKS.comprar.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Ayuda
            </h4>
            <ul className="mt-2 space-y-1.5">
              {LINKS.ayuda.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contacto */}
        <section className="relative px-4 pt-7 lg:px-8">
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
            Contacto
          </h4>
          <ul className="mt-2 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary-foreground/90" />
              <a href="https://wa.me/56964269246" className="hover:text-white">
                +56 9 6426 9246
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-accent" />
              <span>Santiago, Chile</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary-foreground/90" />
              <span>Lunes a sábado · 08:30 a 20:30</span>
            </li>
          </ul>
        </section>

        {/* Bottom bar */}
        <div className="relative mt-8 border-t border-white/10 px-4 py-5 text-center lg:px-8">
          <p className="inline-flex items-center justify-center gap-1.5 text-[11px] text-white/60">
            Hecho con
            <Heart className="h-3 w-3 fill-accent text-accent" />
            en Chile
          </p>
          <p className="mt-1 text-[11px] text-white/50">
            © {new Date().getFullYear()} Confitería Quelita · Todos los derechos reservados
          </p>
          <div className="mt-2 flex justify-center gap-4 text-[11px]">
            <Link href="/terminos" className="text-white/60 hover:text-white">
              Términos
            </Link>
            <span className="text-white/30">·</span>
            <Link href="/privacidad" className="text-white/60 hover:text-white">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
