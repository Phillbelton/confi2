'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionTransitions } from '@/lib/design-system';

interface PremiumBadgeProps {
  icon?: LucideIcon;
  text: string;
  pulse?: boolean;
  className?: string;
}

/**
 * Premium Badge Component
 *
 * Badge estilo HeroSection con dot pulsante opcional y efecto glassmorphism.
 *
 * @example
 * <PremiumBadge
 *   icon={Sparkles}
 *   text="Nuevos productos cada semana"
 *   pulse
 * />
 */
export function PremiumBadge({
  icon: Icon,
  text,
  pulse = false,
  className,
}: PremiumBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransitions.smooth}
      className={cn('inline-flex items-center gap-2 mb-6', className)}
    >
      <div className="px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
        <div className="flex items-center gap-2">
          {pulse && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <span className="text-sm font-medium text-primary">{text}</span>
        </div>
      </div>
    </motion.div>
  );
}
