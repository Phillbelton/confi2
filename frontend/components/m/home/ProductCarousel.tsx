'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

/**
 * Vitrina horizontal de productos con scroll NATIVO + CSS scroll-snap.
 *
 * El scroll nativo corre en el hilo del compositor (igual que el scroll
 * vertical de la página), por lo que el arrastre en celular es fluido. Antes
 * usaba embla-carousel, que mueve el track por JS en cada frame y se sentía
 * lento/entrecortado al arrastrar horizontalmente en mobile.
 *
 * Las flechas (solo desktop) hacen scrollBy suave sobre el contenedor. Su
 * estado habilitado/deshabilitado se deriva de un listener pasivo (no bloquea
 * el scroll) con throttle por rAF.
 */
export function ProductCarousel({ products, isLoading }: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 1);
    setCanNext(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateArrows();
        ticking = false;
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, products.length]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden px-4 pb-4 lg:px-8 lg:gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-[248px] w-[max(176px,calc(50vw_-_22px))] shrink-0 animate-pulse rounded-2xl bg-muted sm:w-52 lg:h-[300px] lg:w-52"
          />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="px-4 pb-2 text-sm text-muted-foreground lg:px-8">
        No hay productos disponibles.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:gap-4 lg:px-8 lg:pb-6"
      >
        {/* Mobile: cada card mide igual que la del catálogo (grilla 2-col,
            px-4 gap-3 → 50vw - 22px); sm/desktop conservan su ancho fijo. */}
        {products.map((p) => (
          <div key={p._id} className="shrink-0 w-[max(176px,calc(50vw_-_22px))] snap-start sm:w-52 lg:w-52">
            <ProductCardM product={p} />
          </div>
        ))}
      </div>

      {/* Flechas (solo desktop) — opcionales, no requeridas para usar el carrusel.
          Centradas sobre la IMAGEN del producto (card lg = w-52 = 208px →
          aspect-square → centro a 6.5rem del borde superior del scroller), con
          estética "glass": blur, aro fino y sombra suave; hover eleva y tiñe la
          flecha con el acento de marca. */}
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollByDir(-1)}
        disabled={!canPrev}
        className={cn(
          'hidden lg:grid absolute left-2 top-[6.5rem] z-10 h-11 w-11 -translate-y-1/2 place-items-center',
          'rounded-full bg-background/80 text-foreground/70 ring-1 ring-border backdrop-blur-md',
          'shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all duration-200 ease-out',
          'hover:scale-110 hover:bg-background hover:text-primary hover:shadow-[0_8px_22px_rgba(0,0,0,0.18)]',
          'active:scale-95 disabled:opacity-0 disabled:pointer-events-none'
        )}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => scrollByDir(1)}
        disabled={!canNext}
        className={cn(
          'hidden lg:grid absolute right-2 top-[6.5rem] z-10 h-11 w-11 -translate-y-1/2 place-items-center',
          'rounded-full bg-background/80 text-foreground/70 ring-1 ring-border backdrop-blur-md',
          'shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all duration-200 ease-out',
          'hover:scale-110 hover:bg-background hover:text-primary hover:shadow-[0_8px_22px_rgba(0,0,0,0.18)]',
          'active:scale-95 disabled:opacity-0 disabled:pointer-events-none'
        )}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
