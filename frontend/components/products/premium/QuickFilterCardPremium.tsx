'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface QuickFilterCardPremiumProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: LucideIcon;
  label: string;
  id?: string;
  className?: string;
}

export function QuickFilterCardPremium({
  checked,
  onChange,
  icon: Icon,
  label,
  id,
  className,
}: QuickFilterCardPremiumProps) {
  const filterId = id || `quick-filter-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex items-center gap-3 p-3 sm:p-4',
        'rounded-xl border-2 transition-all duration-200 cursor-pointer',
        'min-h-[60px] touch-target',
        checked
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        className
      )}
      onClick={() => onChange(!checked)}
    >
      {/* Icon Container */}
      <motion.div
        animate={{
          scale: checked ? [1, 1.2, 1] : 1,
          rotate: checked ? [0, 10, -10, 0] : 0,
        }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex items-center justify-center',
          'w-10 h-10 sm:w-12 sm:h-12 rounded-lg',
          'transition-all duration-200',
          checked
            ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-sm'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6')} />
      </motion.div>

      {/* Label */}
      <Label
        htmlFor={filterId}
        className={cn(
          'flex-1 font-medium cursor-pointer select-none',
          'text-sm sm:text-base',
          'transition-colors duration-200',
          checked ? 'text-primary' : 'text-foreground'
        )}
      >
        {label}
      </Label>

      {/* Checkbox */}
      <div className="flex-shrink-0">
        <Checkbox
          id={filterId}
          checked={checked}
          onCheckedChange={onChange}
          className={cn(
            'w-5 h-5',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary'
          )}
        />
      </div>

      {/* Selection Indicator */}
      {checked && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ scaleY: 0 }}
          className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-r-full"
        />
      )}

      {/* Glow effect when selected */}
      {checked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          className="absolute inset-0 bg-gradient-to-r from-primary to-primary/0 rounded-xl pointer-events-none"
        />
      )}
    </motion.div>
  );
}
