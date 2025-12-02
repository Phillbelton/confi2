'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate scroll progress (0 to 1)
    const maxScroll = scrollWidth - clientWidth;
    setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    checkScroll();
    scrollContainer.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [products]);

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
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{
            opacity: canScrollLeft ? 1 : 0,
            x: canScrollLeft ? 0 : 10,
          }}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'hidden sm:block',
            '-translate-x-1/2',
            !canScrollLeft && 'pointer-events-none'
          )}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="bg-background shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>

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
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: canScrollRight ? 1 : 0,
            x: canScrollRight ? 0 : -10,
          }}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'hidden sm:block',
            'translate-x-1/2',
            !canScrollRight && 'pointer-events-none'
          )}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="bg-background shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Progress Indicator - Subtle dot style */}
      {(canScrollLeft || canScrollRight) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-1.5 mt-4"
        >
          <div className="relative w-16 h-1 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
              style={{
                width: `${Math.max(10, scrollProgress * 100)}%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
