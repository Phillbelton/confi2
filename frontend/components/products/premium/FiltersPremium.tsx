'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Sparkles, Tag, DollarSign, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { HierarchicalCategoryFilter } from '../HierarchicalCategoryFilter';
import type { ProductFilters as Filters, Brand } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import { cn } from '@/lib/utils';

interface FiltersPremiumProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  categories: CategoryWithSubcategories[];
  brands: Brand[];
  className?: string;
  isMobile?: boolean;
}

function FiltersContent({
  filters,
  onFilterChange,
  categories,
  brands,
}: Omit<FiltersPremiumProps, 'className' | 'isMobile'>) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 100000,
  ]);

  const handleCategorySelectionChange = (selectedIds: string[]) => {
    onFilterChange({ ...filters, categories: selectedIds });
  };

  const handleBrandToggle = (brandId: string) => {
    const current = filters.brands || [];
    const updated = current.includes(brandId)
      ? current.filter((id) => id !== brandId)
      : [...current, brandId];

    onFilterChange({ ...filters, brands: updated });
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const handlePriceCommit = () => {
    onFilterChange({
      ...filters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    });
  };

  const clearAllFilters = () => {
    setPriceRange([0, 100000]);
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.brands?.length) count += filters.brands.length;
    if (filters.minPrice || filters.maxPrice) count += 1;
    if (filters.featured) count += 1;
    if (filters.onSale) count += 1;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="space-y-6">
      {/* Header with Clear */}
      {activeCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {activeCount} filtro{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 text-xs hover:bg-primary/10"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        </motion.div>
      )}

      {/* Quick Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          Filtros Rápidos
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer',
            filters.featured
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted'
          )}
          onClick={() => onFilterChange({ ...filters, featured: !filters.featured })}
        >
          <Checkbox
            id="featured-premium"
            checked={filters.featured || false}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, featured: checked as boolean })
            }
          />
          <Label
            htmlFor="featured-premium"
            className="flex-1 text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Destacados
          </Label>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer',
            filters.onSale
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted'
          )}
          onClick={() => onFilterChange({ ...filters, onSale: !filters.onSale })}
        >
          <Checkbox
            id="onSale-premium"
            checked={filters.onSale || false}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, onSale: checked as boolean })
            }
          />
          <Label
            htmlFor="onSale-premium"
            className="flex-1 text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <Tag className="h-4 w-4 text-primary" />
            En Oferta
          </Label>
        </motion.div>
      </div>

      <Separator />

      {/* Accordion Filters */}
      <Accordion type="multiple" defaultValue={['categories', 'brands', 'price']} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4 text-primary" />
              Categorías
              {filters.categories && filters.categories.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.categories.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <HierarchicalCategoryFilter
              categories={categories}
              selectedCategories={filters.categories || []}
              onSelectionChange={handleCategorySelectionChange}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Brands */}
        <AccordionItem value="brands" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Marcas
              {filters.brands && filters.brands.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.brands.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-2">
              {brands.slice(0, 15).map((brand) => (
                <motion.div
                  key={brand._id}
                  whileHover={{ x: 4 }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Checkbox
                    id={`brand-premium-${brand._id}`}
                    checked={filters.brands?.includes(brand._id)}
                    onCheckedChange={() => handleBrandToggle(brand._id)}
                  />
                  <Label
                    htmlFor={`brand-premium-${brand._id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {brand.name}
                  </Label>
                </motion.div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-none">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Rango de Precio
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 px-2 py-4">
              <Slider
                value={priceRange}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceCommit}
                min={0}
                max={100000}
                step={1000}
                className="w-full"
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 p-3 bg-muted rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Mínimo</div>
                  <div className="text-sm font-bold text-foreground">
                    ${priceRange[0].toLocaleString()}
                  </div>
                </div>
                <div className="text-muted-foreground">—</div>
                <div className="flex-1 p-3 bg-muted rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Máximo</div>
                  <div className="text-sm font-bold text-foreground">
                    ${priceRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function FiltersPremium({
  filters,
  onFilterChange,
  categories,
  brands,
  className,
  isMobile = false,
}: FiltersPremiumProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (filters.categories?.length || 0) +
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full relative">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
              >
                {activeCount}
              </motion.span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtrar Productos
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FiltersContent
              filters={filters}
              onFilterChange={onFilterChange}
              categories={categories}
              brands={brands}
            />
          </div>
          <SheetFooter className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-6">
            <Button onClick={() => setOpen(false)} className="w-full gradient-primary text-white">
              Ver Resultados
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn('bg-card rounded-xl border border-border p-6 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Filtros</h2>
      </div>
      <FiltersContent
        filters={filters}
        onFilterChange={onFilterChange}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
