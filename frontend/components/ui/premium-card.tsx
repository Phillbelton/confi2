'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PremiumCardProps {
  children: ReactNode;
  hover?: boolean;
  gradient?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Premium Card Component
 *
 * Card con elevación dinámica y efectos de hover inspirados en HeroSection.
 *
 * @example
 * <PremiumCard hover gradient>
 *   <h3>Título</h3>
 *   <p>Contenido...</p>
 * </PremiumCard>
 */
export function PremiumCard({
  children,
  hover = true,
  gradient = false,
  className,
  onClick,
}: PremiumCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-card border border-border',
        'shadow-md hover:shadow-premium transition-all',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-subtle opacity-50 pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10 p-6">{children}</div>
    </motion.div>
  );
}
