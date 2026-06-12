'use client';

import { Clock, MapPin, Navigation } from 'lucide-react';
import { SectionHeader } from '@/components/m/home/SectionHeader';
import type { HomeSectionConfig, StoreLocation } from '@/types';

/**
 * Sección "Visita nuestras tiendas": mapas de Google embebidos (sin API key)
 * + dirección, horario y botón "Cómo llegar" por local. Los iframes van con
 * loading="lazy": al estar abajo del fold no cuestan nada en el first paint.
 * El embed con query "Negocio, dirección" muestra la ficha de Google
 * Business (rating + reseñas) cuando existe.
 */

function embedUrl(store: StoreLocation): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(store.mapQuery)}&output=embed&hl=es`;
}

function directionsUrl(store: StoreLocation): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.mapQuery)}`;
}

function StoreCard({ store }: { store: StoreLocation }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
    <>
      <SectionHeader
        title={config.title || 'Visita nuestras tiendas'}
        emoji={config.emoji}
      />
      <div
        className={`grid grid-cols-1 gap-4 px-4 pb-8 lg:gap-6 lg:px-8 ${
          stores.length === 1 ? 'lg:grid-cols-1 lg:max-w-3xl lg:mx-auto' : 'lg:grid-cols-2'
        }`}
      >
        {stores.map((store, i) => (
          <StoreCard key={`${store.mapQuery}-${i}`} store={store} />
        ))}
      </div>
    </>
  );
}
