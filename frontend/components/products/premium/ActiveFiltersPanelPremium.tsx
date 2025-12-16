'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductFilters, Brand } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';

interface ActiveFiltersPanelPremiumProps {
  filters: ProductFilters;
  categories: CategoryWithSubcategories[];
  brands: Brand[];
  onRemoveFilter: (type: 'category' | 'brand' | 'price' | 'featured' | 'onSale', value?: string) => void;
  className?: string;
}

// Helper to find category by ID (including subcategories)
function findCategory(
  categoryId: string,
  categories: CategoryWithSubcategories[]
): CategoryWithSubcategories | null {
  for (const cat of categories) {
    if (cat._id === categoryId) return cat;
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        if (sub._id === categoryId) return sub as CategoryWithSubcategories;
      }
    }
  }
  return null;
}

export function ActiveFiltersPanelPremium({
  filters,
  categories,
  brands,
  onRemoveFilter,
  className,
}: ActiveFiltersPanelPremiumProps) {
  const hasActiveFilters =
    (filters.categories?.length || 0) +
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  if (hasActiveFilters === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        'p-4 rounded-xl',
        'bg-gradient-to-r from-pink-50 to-purple-50',
        'border border-pink-100',
        'shadow-sm',
        className
      )}
    >
      {/* Header */}
      <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 text-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        Filtros Activos
        <Badge variant="secondary" className="ml-1">
          {hasActiveFilters}
        </Badge>
      </h4>

      {/* Active Filters List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {/* Categories */}
          {filters.categories?.map((catId) => {
            const cat = findCategory(catId, categories);
            if (!cat) return null;

            const visualConfig = getCategoryVisualConfig(cat.name);

            return (
              <motion.div
                key={`category-${catId}`}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex items-center justify-between',
                  'p-2 sm:p-2.5 rounded-lg',
                  'bg-white shadow-sm border',
                  visualConfig.borderColor,
                  'group hover:shadow-md transition-shadow'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Emoji Icon */}
                  <span className="text-lg sm:text-xl flex-shrink-0">
                    {visualConfig.emoji}
                  </span>

                  {/* Category Name */}
                  <span
                    className={cn(
                      'text-xs sm:text-sm font-medium truncate',
                      visualConfig.textColor
                    )}
                  >
                    {cat.name}
                  </span>
                </div>

                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemoveFilter('category', catId)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors flex-shrink-0',
                    'hover:bg-pink-100 text-pink-500 hover:text-pink-700',
                    'touch-target'
                  )}
                  aria-label={`Remover filtro ${cat.name}`}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
              </motion.div>
            );
          })}

          {/* Brands */}
          {filters.brands?.map((brandId) => {
            const brand = brands.find((b) => b._id === brandId);
            if (!brand) return null;

            return (
              <motion.div
                key={`brand-${brandId}`}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex items-center justify-between',
                  'p-2 sm:p-2.5 rounded-lg',
                  'bg-white shadow-sm border border-purple-200',
                  'group hover:shadow-md transition-shadow'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Brand Icon */}
                  <span className="text-lg sm:text-xl flex-shrink-0">🏷️</span>

                  {/* Brand Name */}
                  <span className="text-xs sm:text-sm font-medium text-purple-700 truncate">
                    {brand.name}
                  </span>
                </div>

                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemoveFilter('brand', brandId)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors flex-shrink-0',
                    'hover:bg-purple-100 text-purple-500 hover:text-purple-700',
                    'touch-target'
                  )}
                  aria-label={`Remover filtro ${brand.name}`}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
              </motion.div>
            );
          })}

          {/* Price Range */}
          {(filters.minPrice !== undefined && filters.minPrice > 0) ||
          (filters.maxPrice !== undefined && filters.maxPrice < 100000) ? (
            <motion.div
              key="price-range"
              layout
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-center justify-between',
                'p-2 sm:p-2.5 rounded-lg',
                'bg-white shadow-sm border border-emerald-200',
                'group hover:shadow-md transition-shadow'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Price Icon */}
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />

                {/* Price Range */}
                <span className="text-xs sm:text-sm font-medium text-emerald-700 truncate">
                  ${(filters.minPrice || 0).toLocaleString()} -{' '}
                  {filters.maxPrice && filters.maxPrice < 100000
                    ? `$${filters.maxPrice.toLocaleString()}`
                    : '∞'}
                </span>
              </div>

              {/* Remove Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onRemoveFilter('price')}
                className={cn(
                  'p-1.5 rounded-full transition-colors flex-shrink-0',
                  'hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700',
                  'touch-target'
                )}
                aria-label="Remover filtro de precio"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
            </motion.div>
          ) : null}

          {/* Featured */}
          {filters.featured && (
            <motion.div
              key="featured"
              layout
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-center justify-between',
                'p-2 sm:p-2.5 rounded-lg',
                'bg-white shadow-sm border border-amber-200',
                'group hover:shadow-md transition-shadow'
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-amber-700">
                  Destacados
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onRemoveFilter('featured')}
                className={cn(
                  'p-1.5 rounded-full transition-colors flex-shrink-0',
                  'hover:bg-amber-100 text-amber-500 hover:text-amber-700',
                  'touch-target'
                )}
                aria-label="Remover filtro destacados"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* On Sale */}
          {filters.onSale && (
            <motion.div
              key="onSale"
              layout
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-center justify-between',
                'p-2 sm:p-2.5 rounded-lg',
                'bg-white shadow-sm border border-red-200',
                'group hover:shadow-md transition-shadow'
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg sm:text-xl flex-shrink-0">🏷️</span>
                <span className="text-xs sm:text-sm font-medium text-red-700">
                  En Oferta
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onRemoveFilter('onSale')}
                className={cn(
                  'p-1.5 rounded-full transition-colors flex-shrink-0',
                  'hover:bg-red-100 text-red-500 hover:text-red-700',
                  'touch-target'
                )}
                aria-label="Remover filtro en oferta"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
