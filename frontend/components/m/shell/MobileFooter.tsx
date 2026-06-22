'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from 'lucide-react';
import { businessWhatsappHref, formatBusinessWhatsapp } from '@/lib/whatsapp';
import { SocialLinks } from '@/components/layout/SocialLinks';

const TRUST_BADGES = [
  { icon: Truck, label: 'Envío rápido', sub: 'Todo Chile' },
  { icon: ShieldCheck, label: 'Compra segura', sub: 'Datos protegidos' },
  { icon: Wallet, label: 'Pagá fácil', sub: 'Efectivo o tarjeta' },
];

const LINKS = {
  comprar: [
    { label: 'Catálogo completo', href: '/productos' },
    { label: 'Ofertas', href: '/productos?onSale=true' },
    { label: 'Destacados', href: '/productos?featured=true' },
    { label: 'Novedades', href: '/productos?sort=newest' },
  ],
  ayuda: [
    { label: 'Cómo comprar', href: '/ayuda/como-comprar' },
    { label: 'Formas de pago', href: '/ayuda/formas-de-pago' },
    { label: 'Envíos y retiros', href: '/ayuda/envios-y-retiros' },
  ],
};

export function MobileFooter() {
  const whatsappHref = businessWhatsappHref();
  const whatsappDisplay = formatBusinessWhatsapp();
  return (
    <footer className="relative overflow-hidden">
      <div className="relative bg-gradient-to-b from-secondary via-secondary to-secondary/95 candy-bg text-white">
        {/* Blobs decorativos */}
        <div className="pointer-events-none absolute -right-12 top-12 h-48 w-48 rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />

        {/* Contenido capeado — full-bleed background, contenido a 1440px */}
        <div className="relative mx-auto w-full max-w-[1440px]">
          {/* Fila superior: CTA WhatsApp + Trust badges */}
          <div className="px-4 pt-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-6 lg:px-8">
            {/* CTA WhatsApp */}
            <section>
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
                  href={whatsappHref}
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
            <section className="pt-6 lg:pt-0">
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
          </div>

          {/* Fila principal: Brand + Comprar + Ayuda + Contacto */}
          <div className="px-4 pt-8 lg:grid lg:grid-cols-4 lg:gap-8 lg:px-8">
            {/* Brand block */}
            <section>
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
              <SocialLinks
                className="mt-5"
                itemClassName="tappable h-11 w-11 rounded-2xl bg-white/10 text-white hover:scale-105"
                iconClassName="h-5 w-5"
                extra={
                  <Link
                    href="mailto:info@quelita.com"
                    aria-label="Email"
                    className="tappable grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white transition-all hover:bg-primary hover:scale-105"
                  >
                    <Mail className="h-5 w-5" />
                  </Link>
                }
              />
            </section>

            {/* Links: Comprar + Ayuda (en mobile van en 2 cols juntos) */}
            <div className="mt-7 grid grid-cols-2 gap-4 lg:col-span-2 lg:mt-0 lg:gap-8">
              <section>
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
              </section>
              <section>
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
              </section>
            </div>

            {/* Contacto */}
            <section className="mt-7 lg:mt-0">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Contacto
              </h4>
              <ul className="mt-2 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-primary-foreground/90" />
                  <a href={whatsappHref} className="hover:text-white">
                    {whatsappDisplay}
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
          </div>

          {/* Bottom bar */}
          <div className="relative mt-8 flex flex-col items-center gap-1 border-t border-white/10 px-4 py-5 text-center lg:flex-row lg:justify-between lg:gap-4 lg:px-8 lg:text-left">
            <p className="inline-flex items-center justify-center gap-1.5 text-[11px] text-white/60">
              Hecho con
              <Heart className="h-3 w-3 fill-accent text-accent" />
              en Chile
              <span className="text-white/30">·</span>
              © {new Date().getFullYear()} Confitería Quelita
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
