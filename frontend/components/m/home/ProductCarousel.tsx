'use client';

import { useRef, useState } from 'react';
import { ProductCardM } from '@/components/m/catalog/ProductCardM';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

/**
 * Vitrina horizontal de productos. Scroll nativo en touch, drag-to-scroll
 * con mouse en desktop. Sin flechas — UX consistente con mobile.
 */
export function ProductCarousel({ products, isLoading }: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollStart: 0,
    moved: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Solo mouse — touch usa scroll nativo
    if (e.pointerType !== 'mouse') return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current.active = true;
    dragRef.current.startX = e.pageX;
    dragRef.current.scrollStart = el.scrollLeft;
    dragRef.current.moved = false;
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.pageX - dragRef.current.startX;
    if (Math.abs(dx) > 5) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.scrollStart - dx;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    const el = scrollerRef.current;
    if (el) el.releasePointerCapture(e.pointerId);
  };

  // Cancela el click si se hizo drag (evita navegar al producto al soltar)
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-none lg:px-8 lg:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[268px] w-44 shrink-0 animate-pulse rounded-2xl bg-muted lg:h-[340px] lg:w-56"
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
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      className={cn(
        'snap-x-mandatory flex gap-3 overflow-x-auto px-4 pb-4 scroll-pl-safe scroll-pr-safe scrollbar-none lg:px-8 lg:gap-4 lg:pb-6',
        // cursor grab solo en desktop con mouse
        'lg:cursor-grab lg:select-none',
        isDragging && 'lg:cursor-grabbing'
      )}
    >
      {products.map((p) => (
        <ProductCardM
          key={p._id}
          product={p}
          horizontal
          className="lg:w-56 lg:shrink-0"
        />
      ))}
    </div>
  );
}
