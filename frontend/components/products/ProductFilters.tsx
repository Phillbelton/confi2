'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { HierarchicalCategoryFilter } from './HierarchicalCategoryFilter';
import type { ProductFilters as Filters, Brand } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';

interface ProductFiltersProps {
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
}: Omit<ProductFiltersProps, 'className' | 'isMobile'>) {
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
    <div className="space-y-4">
      {/* Clear Filters */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {activeCount} filtro{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 text-xs"
          >
            Limpiar todo
          </Button>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['categories', 'brands', 'price']} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-semibold">
            Categorías
            {filters.categories && filters.categories.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.categories.length}
              </Badge>
            )}
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
        <AccordionItem value="brands">
          <AccordionTrigger className="text-sm font-semibold">
            Marcas
            {filters.brands && filters.brands.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.brands.length}
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {brands.slice(0, 10).map((brand) => (
                <div key={brand._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand._id}`}
                    checked={filters.brands?.includes(brand._id)}
                    onCheckedChange={() => handleBrandToggle(brand._id)}
                  />
                  <Label
                    htmlFor={`brand-${brand._id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {brand.name}
                  </Label>
                </div>
              ))}
              {brands.length > 10 && (
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Ver más marcas...
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold">
            Rango de precio
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 px-2">
              <Slider
                value={priceRange}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceCommit}
                min={0}
                max={100000}
                step={1000}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>${priceRange[0].toLocaleString()}</span>
                <span>${priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Quick Filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={filters.featured || false}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, featured: checked as boolean })
            }
          />
          <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
            Destacados
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="onSale"
            checked={filters.onSale || false}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, onSale: checked as boolean })
            }
          />
          <Label htmlFor="onSale" className="text-sm font-normal cursor-pointer">
            En oferta
          </Label>
        </div>
      </div>
    </div>
  );
}

export function ProductFilters({
  filters,
  onFilterChange,
  categories,
  brands,
  className,
  isMobile = false,
}: ProductFiltersProps) {
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full md:hidden">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {filters && Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtrar productos</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FiltersContent
              filters={filters}
              onFilterChange={onFilterChange}
              categories={categories}
              brands={brands}
            />
          </div>
          <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-6">
            <Button onClick={() => setOpen(false)} className="w-full">
              Aplicar filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={className}>
      <FiltersContent
        filters={filters}
        onFilterChange={onFilterChange}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
