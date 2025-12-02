'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

/**
 * SkeletonCard - Premium skeleton loader for product cards
 *
 * Features:
 * - Shimmer animation using Framer Motion
 * - Gradient background
 * - Stagger animation when multiple cards
 * - Accessible with aria-busy
 *
 * @example
 * ```tsx
 * <SkeletonCard />
 * <SkeletonCard variant="compact" />
 * ```
 */

interface SkeletonCardProps {
  /**
   * Card variant
   * @default "default"
   */
  variant?: 'default' | 'compact' | 'wide';

  /**
   * Animation delay for stagger effect
   * @default 0
   */
  delay?: number;

  className?: string;
}

const variantStyles = {
  default: 'aspect-square',
  compact: 'aspect-[3/4]',
  wide: 'aspect-[16/9]',
};

export function SkeletonCard({
  variant = 'default',
  delay = 0,
  className
}: SkeletonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      <Card
        className="overflow-hidden border-border/50"
        aria-busy="true"
        aria-label="Loading product..."
      >
        {/* Image Skeleton */}
        <div className={cn('relative overflow-hidden bg-muted', variantStyles[variant])}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Content Skeleton */}
        <div className="p-4 space-y-3">
          {/* Badge skeleton */}
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-muted rounded-full overflow-hidden relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.1,
                }}
              />
            </div>
          </div>

          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded overflow-hidden relative w-3/4">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.2,
                }}
              />
            </div>
            <div className="h-3 bg-muted rounded overflow-hidden relative w-1/2">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.3,
                }}
              />
            </div>
          </div>

          {/* Price skeleton */}
          <div className="h-6 bg-muted rounded overflow-hidden relative w-24">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.4,
              }}
            />
          </div>

          {/* Button skeleton */}
          <div className="h-10 bg-muted rounded-md overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.5,
              }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * SkeletonGrid - Grid of skeleton cards with stagger animation
 */
interface SkeletonGridProps {
  /**
   * Number of skeleton cards to show
   * @default 8
   */
  count?: number;

  /**
   * Card variant
   * @default "default"
   */
  variant?: 'default' | 'compact' | 'wide';

  /**
   * Grid columns configuration
   * @default "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
   */
  columns?: string;

  className?: string;
}

export function SkeletonGrid({
  count = 8,
  variant = 'default',
  columns = 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  className
}: SkeletonGridProps) {
  return (
    <div className={cn('grid gap-4 sm:gap-6', columns, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={index}
          variant={variant}
          delay={index * 0.05} // Stagger delay
        />
      ))}
    </div>
  );
}

/**
 * SkeletonList - List skeleton for featured products
 */
interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 4, className }: SkeletonListProps) {
  return (
    <div className={cn('flex gap-4 overflow-hidden', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex-shrink-0 w-64">
          <SkeletonCard variant="default" delay={index * 0.1} />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonCategory - Skeleton for category cards
 */
export function SkeletonCategory({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut'
      }}
      className="relative overflow-hidden rounded-lg aspect-square bg-muted"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Category text skeleton */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4 overflow-hidden relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.2,
            }}
          />
        </div>
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2 overflow-hidden relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.3,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * SkeletonText - Text line skeleton with shimmer
 */
interface SkeletonTextProps {
  width?: string;
  className?: string;
}

export function SkeletonText({ width = 'w-full', className }: SkeletonTextProps) {
  return (
    <div className={cn('h-4 bg-muted rounded overflow-hidden relative', width, className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
