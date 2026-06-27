'use client';

import { Fragment } from 'react';
import { CollectionsGrid } from '@/components/m/home/CollectionsGrid';
import { PromoGrid } from '@/components/m/home/PromoGrid';
import {
  ProductCarouselSection,
  ProductGridSection,
} from '@/components/m/home/ProductSection';
import { StoreLocationsSection } from '@/components/m/home/StoreLocations';
import { useHomeLayout } from '@/hooks/useHomeLayout';
import type { HomeSection } from '@/types';

/**
 * La home se arma desde el layout gestionable en /admin/banners (orden,
 * visibilidad y config de secciones viven en Mongo — cero deploys para
 * cambiarlos). Acá solo viven los renderers de cada TIPO de sección; los
 * carruseles/grillas de producto son instancias configurables (Fase 2).
 */

function renderSection(section: HomeSection): React.ReactNode {
  const config = section.config ?? {};
  switch (section.type) {
    case 'hero':
      return (
        <PromoGrid placement="home_hero" className="px-4 pt-3 lg:px-0 lg:pt-0" />
      );
    case 'banner_zone':
      return config.placement ? <PromoGrid placement={config.placement} /> : null;
    case 'collections':
      return <CollectionsGrid variant="carousel" />;
    case 'static_cta':
      return (
        <section className="px-4 py-3 lg:px-8 lg:py-6">
          <div className="rounded-3xl bg-gradient-to-r from-accent/15 via-accent/10 to-primary/10 p-4 text-center lg:p-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent lg:text-sm">
              Compra por mayor
            </p>
            <p className="mt-1 font-display text-base font-bold leading-snug lg:text-2xl">
              Más cantidad, mejor precio 🎉
            </p>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
              Descuentos automáticos según el volumen.
            </p>
          </div>
        </section>
      );
    case 'product_carousel':
      return <ProductCarouselSection config={config} />;
    case 'product_grid':
      return <ProductGridSection config={config} />;
    case 'location_map':
      return <StoreLocationsSection config={config} />;
    default:
      return null;
  }
}

export default function HomePage() {
  const { sections } = useHomeLayout();

  // Mientras llega el layout (una sola vez por sesión, después queda cacheado)
  // se reserva el alto del hero para no saltar el contenido.
  if (!sections) {
    return (
      <div className="px-4 pt-3 lg:px-0 lg:pt-4">
        <div className="aspect-[700/330] animate-pulse rounded-2xl bg-muted lg:aspect-[1920/364] lg:rounded-none" />
      </div>
    );
  }

  return (
    <>
      {sections
        .filter((s) => s.active)
        .map((s) => (
          <Fragment key={s.id}>{renderSection(s)}</Fragment>
        ))}
    </>
  );
}
