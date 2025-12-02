'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProductCardWithVariants } from '@/components/products/ProductCardWithVariants';
import { cn } from '@/lib/utils';
import type { ProductParent } from '@/types';

interface ProductCarouselProps {
  products: ProductParent[];
  title?: string;
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number; // in milliseconds
}

export function ProductCarousel({
  products,
  title,
  className,
  autoPlay = false,
  autoPlayInterval = 5000,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate scroll progress (0 to 1)
    const maxScroll = scrollWidth - clientWidth;
    setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);

    // Calculate current page (for dot indicators)
    const itemWidth = 240; // lg width
    const visibleItems = Math.floor(clientWidth / itemWidth);
    const pages = Math.ceil(products.length / visibleItems);
    setTotalPages(Math.max(pages, 1));

    const currentPageCalc = Math.round((scrollLeft / maxScroll) * (pages - 1));
    setCurrentPage(Math.max(0, Math.min(currentPageCalc, pages - 1)));
  };

  // IntersectionObserver for lazy animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentRef = scrollRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Scroll tracking
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollRef.current) return;

      // Only handle if carousel is in view and focused
      if (!isInView) return;

      if (e.key === 'ArrowLeft' && canScrollLeft) {
        e.preventDefault();
        scroll('left');
      } else if (e.key === 'ArrowRight' && canScrollRight) {
        e.preventDefault();
        scroll('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canScrollLeft, canScrollRight, isInView]);

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || !isInView || isDragging) return;

    const interval = setInterval(() => {
      if (canScrollRight) {
        scroll('right');
      } else {
        // Loop back to start
        scrollToPage(0);
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, isInView, isDragging, canScrollRight, autoPlayInterval]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Scroll to specific page
  const scrollToPage = (page: number) => {
    if (!scrollRef.current) return;
    const { scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const targetScroll = (page / (totalPages - 1)) * maxScroll;

    scrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (scrollRef.current) {
        scrollRef.current.style.cursor = 'grab';
      }
    }
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
            'scrollbar-hide cursor-grab active:cursor-grabbing',
            '-mx-4 px-4 sm:mx-0 sm:px-0',
            isDragging && 'select-none'
          )}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[240px] snap-start"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94] as const,
              }}
              whileHover={{
                y: -4,
                transition: { duration: 0.2, ease: 'easeOut' as const },
              }}
            >
              <ProductCardWithVariants product={product} />
            </motion.div>
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

      {/* Dot Navigation Indicators */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-2 mt-4"
          role="tablist"
          aria-label="Carousel navigation"
        >
          {Array.from({ length: totalPages }).map((_, index) => (
            <motion.button
              key={index}
              onClick={() => scrollToPage(index)}
              className={cn(
                'rounded-full transition-all duration-300',
                'hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                index === currentPage
                  ? 'w-8 h-2 bg-gradient-to-r from-primary to-secondary'
                  : 'w-2 h-2 bg-muted/40 hover:bg-muted/60'
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              role="tab"
              aria-selected={index === currentPage}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
