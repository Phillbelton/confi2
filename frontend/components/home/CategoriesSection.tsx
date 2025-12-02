'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCategory } from '@/components/ui/skeleton-card';
import { CategoryCard } from './CategoryCard';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer } from '@/lib/motion-variants';
import type { Category } from '@/types';

interface CategoriesSectionProps {
  categories: Category[];
  isLoading?: boolean;
}

export function CategoriesSection({ categories, isLoading }: CategoriesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h2 className="text-xl sm:text-2xl font-bold">Categorías</h2>
          <Link href="/productos">
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Categories Scroll */}
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32">
                <SkeletonCategory delay={i * 0.05} />
              </div>
            ))}
          </div>
        ) : (
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
                '-translate-x-1/2 bg-background shadow-lg h-8 w-8'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div
              ref={scrollRef}
              className={cn(
                'flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory',
                'scrollbar-hide',
                '-mx-4 px-4 sm:mx-0 sm:px-0'
              )}
            >
              {categories.map((category) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  className="snap-start"
                />
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
                'translate-x-1/2 bg-background shadow-lg h-8 w-8'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
