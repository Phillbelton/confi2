'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DecorativeBackgroundProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'vibrant';
}

/**
 * Decorative Background Component
 *
 * Contenedor con efectos ambientales (gradient orbs) inspirados en HeroSection.
 * Aplica los efectos decorativos al fondo principal, permitiendo que las secciones
 * sean transparentes y hereden el ambiente.
 *
 * @example
 * <DecorativeBackground intensity="medium">
 *   <YourContent />
 * </DecorativeBackground>
 */
export function DecorativeBackground({
  children,
  className,
  intensity = 'medium',
}: DecorativeBackgroundProps) {
  // Configuración de opacidad según intensidad
  const opacityMap = {
    subtle: { orb1: 0.15, orb2: 0.1, orb3: 0.12 },
    medium: { orb1: 0.2, orb2: 0.15, orb3: 0.18 },
    vibrant: { orb1: 0.3, orb2: 0.25, orb3: 0.28 },
  };

  const opacity = opacityMap[intensity];

  return (
    <div className={cn('relative w-full min-h-screen', className)}>
      {/* Gradient Orbs - Fondo decorativo infinito */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orb 1: Top Right - Primary/Orange */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [opacity.orb1, opacity.orb1 * 1.5, opacity.orb1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary blur-3xl"
          aria-hidden="true"
        />

        {/* Orb 2: Center Left - Accent/Yellow */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [opacity.orb2, opacity.orb2 * 1.8, opacity.orb2],
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute top-1/3 -left-48 w-[600px] h-[600px] rounded-full bg-accent blur-3xl"
          aria-hidden="true"
        />

        {/* Orb 3: Bottom Right - Secondary/Purple */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [opacity.orb3, opacity.orb3 * 1.6, opacity.orb3],
            x: [0, 30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-20 right-1/4 w-[450px] h-[450px] rounded-full bg-secondary blur-3xl"
          aria-hidden="true"
        />

        {/* Orb 4: Bottom Left - Primary (complementary) */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [opacity.orb1 * 0.8, opacity.orb1 * 1.2, opacity.orb1 * 0.8],
            x: [0, -20, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1.5,
          }}
          className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full bg-primary blur-3xl"
          aria-hidden="true"
        />
      </div>

      {/* Contenido con z-index superior */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
