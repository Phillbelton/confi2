'use client';

import { Clock, MapPin, Navigation } from 'lucide-react';
import type { HomeSectionConfig, StoreLocation } from '@/types';

/**
 * Sección "Visita nuestras tiendas": mapas de Google embebidos (sin API key)
 * + dirección, horario y botón "Cómo llegar" por local. Los iframes van con
 * loading="lazy": al estar abajo del fold no cuestan nada en el first paint.
 * El embed con query "Negocio, dirección" muestra la ficha de Google
 * Business (rating + reseñas) cuando existe.
 *
 * El fondo (desktop/tablet) recrea el muro de marca: gradiente turquesa +
 * logo como marca de agua tintada (mix-blend) + textura de ruido sutil.
 * En mobile el fondo va liso para no competir con las tarjetas apiladas.
 */

/** Textura de ruido tipo muro, generada con SVG (sin asset externo). */
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;

function embedUrl(store: StoreLocation): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(store.mapQuery)}&output=embed&hl=es`;
}

function directionsUrl(store: StoreLocation): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.mapQuery)}`;
}

function StoreCard({ store }: { store: StoreLocation }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <div className="relative aspect-[16/10] lg:aspect-[16/9]">
        <iframe
          src={embedUrl(store)}
          title={`Mapa — ${store.name}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      <div className="space-y-2 p-4">
        <h3 className="font-display text-base font-bold leading-tight">
          {store.name}
        </h3>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {store.address}
        </p>
        {store.hours && (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {store.hours}
          </p>
        )}
        <a
          href={directionsUrl(store)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          <Navigation className="h-4 w-4" />
          Cómo llegar
        </a>
      </div>
    </div>
  );
}

export function StoreLocationsSection({ config }: { config: HomeSectionConfig }) {
  const stores = config.stores ?? [];
  if (stores.length === 0) return null;

  return (
    <section className="full-bleed relative isolate mt-4 overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
      {/* Marca de agua: logo tintado al fondo (solo tablet/desktop). Doble
          capa: una grande centrada y sutil + soft-light para que tiña el
          turquesa sin gritar, igual que un muro pintado. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 hidden w-[min(94%,1200px)] -translate-x-1/2 -translate-y-1/2 opacity-40 mix-blend-soft-light md:block"
      />
      {/* Textura de muro */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.10] mix-blend-overlay"
        style={{ backgroundImage: NOISE_BG }}
        aria-hidden
      />

      <div className="px-4 py-6 lg:px-8 lg:py-14">
        <h2 className="mb-4 text-center font-display text-xl font-bold uppercase tracking-wide text-white drop-shadow-sm lg:mb-6 lg:text-3xl">
          {config.emoji && (
            <span className="mr-2" aria-hidden>
              {config.emoji}
            </span>
          )}
          {config.title || 'Visita nuestras tiendas'}
        </h2>

        <div
          className={`mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:gap-6 ${
            stores.length === 1 ? 'md:max-w-2xl' : 'md:grid-cols-2'
          }`}
        >
          {stores.map((store, i) => (
            <StoreCard key={`${store.mapQuery}-${i}`} store={store} />
          ))}
        </div>
      </div>
    </section>
  );
}
