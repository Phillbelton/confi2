'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryPillsPremiumProps {
  categories: Category[];
  selectedCategory?: string;
  onSelect: (id?: string) => void;
}

export function CategoryPillsPremium({
  categories,
  selectedCategory,
  onSelect,
}: CategoryPillsPremiumProps) {
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
    <div className="relative group">
      {/* Left Scroll Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('left')}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 z-10',
          'hidden md:flex opacity-0 group-hover:opacity-100',
          'transition-opacity duration-300',
          '-translate-x-2 h-10 w-10',
          'bg-card/95 backdrop-blur-sm shadow-premium',
          'hover:bg-card hover:shadow-premium-lg'
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Categories Container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory"
      >
        {/* All Products Pill */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(undefined)}
          className={cn(
            'flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium',
            'transition-all duration-300 whitespace-nowrap',
            'border-2 snap-start touch-target',
            !selectedCategory
              ? 'gradient-primary text-white shadow-premium border-transparent'
              : 'bg-card hover:bg-muted border-border hover:border-primary/50 hover:shadow-premium'
          )}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            Todos
          </span>
        </motion.button>

        {/* Category Pills */}
        {categories.map((cat, index) => (
          <motion.button
            key={cat._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cat._id)}
            className={cn(
              'flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium',
              'transition-all duration-300 whitespace-nowrap',
              'border-2 snap-start touch-target',
              'relative overflow-hidden',
              selectedCategory === cat._id
                ? 'gradient-primary text-white shadow-premium border-transparent'
                : 'bg-card hover:bg-muted border-border hover:border-primary/50 hover:shadow-premium'
            )}
          >
            {/* Animated Background on Hover */}
            {selectedCategory !== cat._id && (
              <motion.div
                className="absolute inset-0 bg-gradient-primary opacity-0 hover:opacity-10"
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            <span className="relative flex items-center gap-2">
              {cat.icon && <span className="text-lg">{cat.icon}</span>}
              {cat.name}

              {/* Selection Indicator */}
              {selectedCategory === cat._id && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-white"
                />
              )}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Right Scroll Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('right')}
        className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 z-10',
          'hidden md:flex opacity-0 group-hover:opacity-100',
          'transition-opacity duration-300',
          'translate-x-2 h-10 w-10',
          'bg-card/95 backdrop-blur-sm shadow-premium',
          'hover:bg-card hover:shadow-premium-lg'
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Scroll Fade Indicators */}
      <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
    </div>
  );
}
