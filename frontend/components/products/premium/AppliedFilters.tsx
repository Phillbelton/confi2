'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProductFilters as Filters, Brand } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';

interface AppliedFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  categories: CategoryWithSubcategories[];
  brands: Brand[];
}

export function AppliedFilters({
  filters,
  onFilterChange,
  categories,
  brands,
}: AppliedFiltersProps) {
  const appliedFilters: Array<{ key: string; label: string; value: any }> = [];

  // Add category filters
  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach((catId) => {
      const category = findCategoryById(categories, catId);
      if (category) {
        appliedFilters.push({
          key: `category-${catId}`,
          label: `Categoría: ${category.name}`,
          value: catId,
        });
      }
    });
  }

  // Add brand filters
  if (filters.brands && filters.brands.length > 0) {
    filters.brands.forEach((brandId) => {
      const brand = brands.find((b) => b._id === brandId);
      if (brand) {
        appliedFilters.push({
          key: `brand-${brandId}`,
          label: `Marca: ${brand.name}`,
          value: brandId,
        });
      }
    });
  }

  // Add price range filter
  if (filters.minPrice || filters.maxPrice) {
    appliedFilters.push({
      key: 'price-range',
      label: `Precio: $${filters.minPrice || 0} - $${filters.maxPrice || '∞'}`,
      value: 'price',
    });
  }

  // Add featured filter
  if (filters.featured) {
    appliedFilters.push({
      key: 'featured',
      label: 'Destacados',
      value: 'featured',
    });
  }

  // Add on sale filter
  if (filters.onSale) {
    appliedFilters.push({
      key: 'onSale',
      label: 'En oferta',
      value: 'onSale',
    });
  }

  // Add search filter
  if (filters.search) {
    appliedFilters.push({
      key: 'search',
      label: `Búsqueda: "${filters.search}"`,
      value: 'search',
    });
  }

  const removeFilter = (filterKey: string, value: any) => {
    const newFilters = { ...filters };

    if (filterKey.startsWith('category-')) {
      newFilters.categories = newFilters.categories?.filter((id) => id !== value);
      if (newFilters.categories?.length === 0) delete newFilters.categories;
    } else if (filterKey.startsWith('brand-')) {
      newFilters.brands = newFilters.brands?.filter((id) => id !== value);
      if (newFilters.brands?.length === 0) delete newFilters.brands;
    } else if (filterKey === 'price-range') {
      delete newFilters.minPrice;
      delete newFilters.maxPrice;
    } else if (filterKey === 'featured') {
      delete newFilters.featured;
    } else if (filterKey === 'onSale') {
      delete newFilters.onSale;
    } else if (filterKey === 'search') {
      delete newFilters.search;
    }

    onFilterChange(newFilters);
  };

  const clearAll = () => {
    onFilterChange({});
  };

  if (appliedFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-muted/30 rounded-xl border border-border"
    >
      <span className="text-sm font-medium text-muted-foreground mr-2">
        Filtros activos:
      </span>

      <AnimatePresence mode="popLayout">
        {appliedFilters.map((filter) => (
          <motion.div
            key={filter.key}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Badge
              variant="secondary"
              className="pl-3 pr-2 py-1.5 gap-1.5 hover:bg-primary/10 transition-colors cursor-default"
            >
              <span className="text-xs">{filter.label}</span>
              <button
                onClick={() => removeFilter(filter.key, filter.value)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>

      {appliedFilters.length > 1 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Limpiar todo
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Helper function to find category by id in nested structure
function findCategoryById(
  categories: CategoryWithSubcategories[],
  id: string
): CategoryWithSubcategories | null {
  for (const cat of categories) {
    if (cat._id === id) return cat;
    if (cat.subcategories) {
      const found = findCategoryById(cat.subcategories, id);
      if (found) return found;
    }
  }
  return null;
}
