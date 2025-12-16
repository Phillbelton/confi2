'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FiltersHeaderPremiumProps {
  productCount?: number;
  activeFilterCount: number;
  onClearFilters: () => void;
  isMobile?: boolean;
  className?: string;
}

export function FiltersHeaderPremium({
  productCount,
  activeFilterCount,
  onClearFilters,
  isMobile = false,
  className,
}: FiltersHeaderPremiumProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-gradient-to-r from-orange-500 to-amber-500',
        isMobile ? 'p-4' : 'p-6',
        'text-white',
        className
      )}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon + Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Filter className={cn('text-white', isMobile ? 'w-5 h-5' : 'w-6 h-6')} />
          </motion.div>

          <h3
            className={cn(
              'font-bold text-white',
              isMobile ? 'text-lg' : 'text-xl'
            )}
          >
            Filtros
          </h3>

          {activeFilterCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex items-center justify-center rounded-full',
                'bg-white text-primary font-bold',
                isMobile ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm'
              )}
            >
              {activeFilterCount}
            </motion.div>
          )}
        </motion.div>

        {/* Product Counter */}
        {productCount !== undefined && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'text-white/90',
              isMobile ? 'text-sm' : 'text-base'
            )}
          >
            <span className="font-medium">{productCount.toLocaleString()}</span>{' '}
            producto{productCount !== 1 ? 's' : ''} encontrado{productCount !== 1 ? 's' : ''}
          </motion.p>
        )}

        {/* Clear Filters Button */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <Button
                variant="ghost"
                size={isMobile ? 'sm' : 'default'}
                onClick={onClearFilters}
                className={cn(
                  'text-white/90 hover:text-white hover:bg-white/20',
                  'transition-all duration-200',
                  'group'
                )}
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  className="mr-2"
                >
                  <X className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                </motion.div>
                Limpiar todos los filtros
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                  className="ml-2"
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-50" />
      </div>
    </div>
  );
}
