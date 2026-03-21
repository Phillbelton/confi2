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
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { CategoryFilterPremium } from './CategoryFilterPremium';
import { FiltersHeaderPremium } from './FiltersHeaderPremium';
import { QuickFilterCardPremium } from './QuickFilterCardPremium';
import { ActiveFiltersPanelPremium } from './ActiveFiltersPanelPremium';
import type { ProductFilters as Filters, Brand } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import { cn } from '@/lib/utils';

interface FiltersPremiumProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  categories: CategoryWithSubcategories[];
  brands: Brand[];
  productCount?: number;
  className?: string;
  isMobile?: boolean;
}

function FiltersContent({
  filters,
  onFilterChange,
  categories,
  brands,
  productCount,
  isMobile = false,
}: Omit<FiltersPremiumProps, 'className'>) {
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

  const handleRemoveFilter = (
    type: 'category' | 'brand' | 'price' | 'featured' | 'onSale',
    value?: string
  ) => {
    switch (type) {
      case 'category':
        if (value) {
          onFilterChange({
            ...filters,
            categories: filters.categories?.filter((id) => id !== value),
          });
        }
        break;
      case 'brand':
        if (value) {
          onFilterChange({
            ...filters,
            brands: filters.brands?.filter((id) => id !== value),
          });
        }
        break;
      case 'price':
        setPriceRange([0, 100000]);
        onFilterChange({
          ...filters,
          minPrice: undefined,
          maxPrice: undefined,
        });
        break;
      case 'featured':
        onFilterChange({ ...filters, featured: false });
        break;
      case 'onSale':
        onFilterChange({ ...filters, onSale: false });
        break;
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Filters - Grid en mobile */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          Filtros Rápidos
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <QuickFilterCardPremium
            checked={filters.featured || false}
            onChange={(checked) => onFilterChange({ ...filters, featured: checked })}
            icon={Sparkles}
            label="Destacados"
          />
          <QuickFilterCardPremium
            checked={filters.onSale || false}
            onChange={(checked) => onFilterChange({ ...filters, onSale: checked })}
            icon={Tag}
            label="En Oferta"
          />
        </div>
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
            <CategoryFilterPremium
              categories={categories}
              selectedCategories={filters.categories || []}
              onSelectionChange={handleCategorySelectionChange}
              isMobile={isMobile}
              showDescriptions={isMobile}
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

      {/* Active Filters Panel */}
      {activeCount > 0 && (
        <ActiveFiltersPanelPremium
          filters={filters}
          categories={categories}
          brands={brands}
          onRemoveFilter={handleRemoveFilter}
        />
      )}
    </div>
  );
}

export function FiltersPremium({
  filters,
  onFilterChange,
  categories,
  brands,
  productCount,
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

  const clearAllFilters = () => {
    onFilterChange({});
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full relative touch-target">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md"
              >
                {activeCount}
              </motion.span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          {/* Header con gradiente sticky */}
          <div className="sticky top-0 z-10">
            <FiltersHeaderPremium
              productCount={productCount}
              activeFilterCount={activeCount}
              onClearFilters={clearAllFilters}
              isMobile
            />
          </div>

          {/* Contenido scrollable */}
          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="p-4">
              <FiltersContent
                filters={filters}
                onFilterChange={onFilterChange}
                categories={categories}
                brands={brands}
                productCount={productCount}
                isMobile
              />
            </div>
          </ScrollArea>

          {/* Footer sticky con gradiente */}
          <SheetFooter className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-safe border-t shadow-premium-lg">
            <div className="w-full px-4">
              <Button
                onClick={() => setOpen(false)}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
                size="lg"
              >
                Ver {productCount || 0} Productos
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version
  return (
    <div className={cn('bg-card rounded-2xl shadow-lg border border-orange-100 overflow-hidden', className)}>
      <FiltersHeaderPremium
        productCount={productCount}
        activeFilterCount={activeCount}
        onClearFilters={clearAllFilters}
      />
      <div className="p-6">
        <FiltersContent
          filters={filters}
          onFilterChange={onFilterChange}
          categories={categories}
          brands={brands}
          productCount={productCount}
        />
      </div>
    </div>
  );
}
