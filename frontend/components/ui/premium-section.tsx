'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PremiumSectionProps {
  children: ReactNode;
  decorative?: boolean;
  waveBottom?: boolean;
  transparent?: boolean; // Si usar fondo transparente (hereda del parent)
  className?: string;
  contentClassName?: string;
  centered?: boolean;
}

/**
 * Premium Section Component
 *
 * Componente base inspirado en HeroSection premium.
 * Incluye orbes de gradiente animados, espaciado generoso, y decoración wave.
 *
 * @example
 * <PremiumSection>
 *   <h1>Mi Título</h1>
 *   <p>Mi contenido...</p>
 * </PremiumSection>
 */
export function PremiumSection({
  children,
  decorative = true,
  waveBottom = false,
  transparent = false,
  className,
  contentClassName,
  centered = false,
}: PremiumSectionProps) {
  return (
    <section
      className={cn(
        'relative w-full overflow-hidden',
        transparent
          ? 'bg-transparent' // Modo transparente: hereda del parent
          : 'bg-gradient-subtle rounded-2xl mb-8 shadow-premium', // Modo con fondo propio
        className
      )}
    >
      {/* Decorative Background Elements */}
      {decorative && !transparent && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl"
          />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative z-10 container mx-auto px-4',
          'py-12 md:py-16 lg:py-20',
          contentClassName
        )}
      >
        <div className={cn(centered && 'max-w-3xl mx-auto text-center')}>
          {children}
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      {waveBottom && (
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-8 md:h-12 fill-background"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C150,80 350,80 600,40 C850,0 1050,0 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>
      )}
    </section>
  );
}
