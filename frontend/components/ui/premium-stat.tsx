'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionTransitions } from '@/lib/design-system';

interface PremiumStatProps {
  icon: LucideIcon;
  value: string;
  label: string;
  index?: number;
  className?: string;
}

/**
 * Premium Stat Component
 *
 * Componente de estadística estilo HeroSection con icono circular y animación de entrada.
 *
 * @example
 * <PremiumStat
 *   icon={Heart}
 *   value="500+"
 *   label="Productos"
 *   index={0}
 * />
 */
export function PremiumStat({
  icon: Icon,
  value,
  label,
  index = 0,
  className,
}: PremiumStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        ...motionTransitions.spring,
        delay: 0.5 + index * 0.1, // Stagger by 100ms
      }}
      className={cn('flex flex-col items-center gap-2', className)}
    >
      {/* Icon Circle */}
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
        <Icon className="w-6 h-6 text-primary" />
      </div>

      {/* Value */}
      <div className="text-2xl md:text-3xl font-bold text-foreground">
        {value}
      </div>

      {/* Label */}
      <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}
