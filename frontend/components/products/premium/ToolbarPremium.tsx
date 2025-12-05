'use client';

import { motion } from 'framer-motion';
import { Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ToolbarPremiumProps {
  totalItems?: number;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFiltersClick?: () => void;
  showFiltersButton?: boolean;
  activeFiltersCount?: number;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes', icon: '🆕' },
  { value: 'price_asc', label: 'Menor precio', icon: '💰' },
  { value: 'price_desc', label: 'Mayor precio', icon: '💎' },
  { value: 'name_asc', label: 'A → Z', icon: '🔤' },
  { value: 'name_desc', label: 'Z → A', icon: '🔡' },
  { value: 'popular', label: 'Más popular', icon: '🔥' },
];

export function ToolbarPremium({
  totalItems,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onFiltersClick,
  showFiltersButton = false,
  activeFiltersCount = 0,
}: ToolbarPremiumProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-card rounded-xl border border-border shadow-sm"
    >
      {/* Left: Results Count + Filters (Mobile) */}
      <div className="flex items-center gap-3">
        {/* Mobile Filters Button */}
        {showFiltersButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFiltersClick}
            className="lg:hidden relative"
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

        {/* Results Count */}
        <div className="flex items-center gap-2">
          <motion.div
            key={totalItems}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-sm font-medium text-foreground"
          >
            {totalItems !== undefined ? (
              <>
                <span className="hidden sm:inline">Mostrando </span>
                <span className="text-primary font-bold">{totalItems}</span>
                <span className="hidden sm:inline"> productos</span>
              </>
            ) : (
              <span className="text-muted-foreground">Cargando...</span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right: Sort + View Toggle */}
      <div className="flex items-center gap-3">
        {/* Sort Selector */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] h-9 bg-background">
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

        {/* View Mode Toggle */}
        <div className="hidden sm:flex items-center border rounded-lg overflow-hidden bg-background">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'rounded-none h-9 px-3',
              viewMode === 'grid' && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="ml-2 hidden md:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'rounded-none h-9 px-3',
              viewMode === 'list' && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
            <span className="ml-2 hidden md:inline">Lista</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
