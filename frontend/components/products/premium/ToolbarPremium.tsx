'use client';

import { motion } from 'framer-motion';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/types';

interface ToolbarPremiumProps {
  totalItems?: number;
  sortBy: string;
  onSortChange: (value: string) => void;
  onFiltersClick?: () => void;
  showFiltersButton?: boolean;
  activeFiltersCount?: number;
  selectedCategory?: Category;
  selectedSubcategory?: Category;
}

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Menor precio', icon: '💰' },
  { value: 'price_desc', label: 'Mayor precio', icon: '💎' },
  { value: 'name_asc', label: 'Nombre A-Z', icon: '🔤' },
  { value: 'name_desc', label: 'Nombre Z-A', icon: '🔡' },
];

export function ToolbarPremium({
  totalItems,
  sortBy,
  onSortChange,
  onFiltersClick,
  showFiltersButton = false,
  activeFiltersCount = 0,
  selectedCategory,
  selectedSubcategory,
}: ToolbarPremiumProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-card rounded-xl border border-border shadow-sm"
    >
      {/* Left: Breadcrumb + Filters (Mobile) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile Filters Button */}
        {showFiltersButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFiltersClick}
            className="lg:hidden relative flex-shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
              >
                {activeFiltersCount}
              </motion.span>
            )}
          </Button>
        )}

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm overflow-x-auto">
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary whitespace-nowrap">
                {selectedCategory.name}
              </span>
              {selectedSubcategory && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-foreground whitespace-nowrap">
                    {selectedSubcategory.name}
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground font-medium">
              Todos los productos
            </span>
          )}

          {/* Product count badge */}
          {totalItems !== undefined && (
            <span className="ml-2 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-medium whitespace-nowrap">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </span>
          )}
        </div>
      </div>

      {/* Right: Sort Selector */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px] h-9 bg-background">
            <div className="flex items-center gap-2">
              <span className="text-xs">Ordenar:</span>
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}
