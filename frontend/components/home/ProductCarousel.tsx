'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCardWithVariants } from '@/components/products/ProductCardWithVariants';
import { cn } from '@/lib/utils';
import type { ProductParent } from '@/types';

interface ProductCarouselProps {
  products: ProductParent[];
  title?: string;
  className?: string;
}

export function ProductCarousel({ products, title, className }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (products.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold mb-4 px-1">{title}</h2>
      )}

      <div className="relative group">
        {/* Left Arrow */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'hidden sm:flex',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            '-translate-x-1/2 bg-background shadow-lg'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className={cn(
            'flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory',
            'scrollbar-hide',
            '-mx-4 px-4 sm:mx-0 sm:px-0'
          )}
        >
          {products.map((product) => (
            <div
              key={product._id}
              className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[240px] snap-start"
            >
              <ProductCardWithVariants product={product} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'hidden sm:flex',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'translate-x-1/2 bg-background shadow-lg'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
