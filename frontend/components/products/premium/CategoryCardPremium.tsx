'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import type { CategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { Badge } from '@/components/ui/badge';

// Animated checkbox component
function AnimatedCheckbox({
  checked,
  indeterminate,
  onChange,
  visualConfig,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  visualConfig: CategoryVisualConfig;
}) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'relative w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2',
        'transition-all duration-200 flex-shrink-0',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        visualConfig.ringColor,
        'touch-target',
        checked || indeterminate
          ? `bg-primary border-primary`
          : `bg-white ${visualConfig.borderColor} hover:border-primary/50`
      )}
      whileTap={{ scale: 0.9 }}
      aria-checked={indeterminate ? 'mixed' : checked}
      role="checkbox"
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            key="checked"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
          </motion.div>
        )}
        {indeterminate && !checked && (
          <motion.div
            key="indeterminate"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Animation variants
const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  hover: {
    y: -2,
  },
  tap: { scale: 0.98 },
};

export type CategoryCardSize = 'small' | 'medium' | 'large';

interface CategoryCardPremiumProps {
  category: CategoryWithSubcategories;
  isSelected: boolean;
  isIndeterminate?: boolean;
  selectedChildCount?: number;
  totalChildCount?: number;
  visualConfig: CategoryVisualConfig;
  onToggle: () => void;
  onExpand?: () => void;
  isExpanded?: boolean;
  size?: CategoryCardSize;
  showDescription?: boolean;
  index?: number;
  className?: string;
}

export function CategoryCardPremium({
  category,
  isSelected,
  isIndeterminate = false,
  selectedChildCount = 0,
  totalChildCount = 0,
  visualConfig,
  onToggle,
  onExpand,
  isExpanded = false,
  size = 'medium',
  showDescription = false,
  index = 0,
  className,
}: CategoryCardPremiumProps) {
  const hasChildren = category.subcategories && category.subcategories.length > 0;

  // Size-specific styles
  const sizeStyles = {
    small: {
      container: 'p-2.5 min-h-[64px]',
      icon: 'w-10 h-10 text-2xl',
      text: 'text-sm',
      gap: 'gap-2',
    },
    medium: {
      container: 'p-3 min-h-[72px]',
      icon: 'w-12 h-12 text-2xl sm:text-3xl',
      text: 'text-sm sm:text-base',
      gap: 'gap-2.5 sm:gap-3',
    },
    large: {
      container: 'p-4 min-h-[80px]',
      icon: 'w-12 h-12 sm:w-14 sm:h-14 text-3xl sm:text-4xl',
      text: 'text-base',
      gap: 'gap-3',
    },
  };

  const styles = sizeStyles[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={cn('relative', className)}
    >
      <motion.div
        className={cn(
          'group relative flex items-center cursor-pointer',
          'rounded-xl border-2 transition-all duration-200',
          styles.container,
          styles.gap,
          isSelected
            ? `${visualConfig.bgColor} ${visualConfig.borderColor} shadow-lg`
            : `border-transparent hover:border-primary/30 ${visualConfig.hoverBg} bg-muted/30`,
          'active:scale-[0.99]'
        )}
        onClick={hasChildren && onExpand ? onExpand : onToggle}
      >
        {/* Icon Container with gradient background */}
        <motion.div
          className={cn(
            'flex items-center justify-center rounded-lg',
            'transition-all duration-200',
            styles.icon,
            isSelected
              ? 'bg-white shadow-md'
              : `bg-gradient-to-br ${visualConfig.gradient}`
          )}
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          {visualConfig.emoji}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'font-medium truncate',
                styles.text,
                isSelected ? visualConfig.textColor : 'text-foreground'
              )}
            >
              {category.name}
            </span>

            {/* Selected children badge */}
            {hasChildren && selectedChildCount > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Badge
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] sm:text-xs font-bold',
                    'bg-primary text-white'
                  )}
                >
                  {selectedChildCount}/{totalChildCount}
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Subcategory count or description */}
          {hasChildren && !showDescription && (
            <span className="text-xs text-muted-foreground block mt-0.5">
              {totalChildCount} subcategoría{totalChildCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Description */}
          {showDescription && visualConfig.description && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={cn(
                'text-xs text-muted-foreground mt-1 line-clamp-1',
                size === 'small' && 'hidden'
              )}
            >
              {visualConfig.description}
            </motion.p>
          )}
        </div>

        {/* Checkbox and Expand Arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasChildren ? (
            <>
              <AnimatedCheckbox
                checked={isSelected && !isIndeterminate}
                indeterminate={isIndeterminate}
                onChange={onToggle}
                visualConfig={visualConfig}
              />
              {onExpand && (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand();
                  }}
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'text-muted-foreground hover:text-foreground',
                    'p-1 rounded hover:bg-muted/50 transition-colors',
                    'touch-target'
                  )}
                  aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                  aria-expanded={isExpanded}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </>
          ) : (
            <AnimatedCheckbox
              checked={isSelected}
              onChange={onToggle}
              visualConfig={visualConfig}
            />
          )}
        </div>

        {/* Selection Indicator Bar */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 4 }}
              exit={{ width: 0 }}
              className={cn(
                'absolute left-0 top-2 bottom-2 rounded-r-full',
                `bg-gradient-to-b ${visualConfig.gradient}`
              )}
            />
          )}
        </AnimatePresence>

        {/* Glow effect when selected */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className={cn(
                'absolute inset-0 rounded-xl pointer-events-none',
                `bg-gradient-to-r ${visualConfig.gradient}`
              )}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
