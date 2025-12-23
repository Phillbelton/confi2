'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Sparkles, Tag, ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProductFilters as Filters, Brand, Category } from '@/types';
import { cn } from '@/lib/utils';

interface FiltersSimplifiedProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClearFilters: () => void;
  brands: Brand[];
  categories?: Category[]; // Todas las categorías (cuando no hay categoría seleccionada)
  subcategories?: Category[]; // Subcategorías de la categoría seleccionada
  productCount?: number;
  className?: string;
}

export function FiltersSimplified({
  filters,
  onFilterChange,
  onClearFilters,
  brands,
  categories = [],
  subcategories = [],
  productCount,
  className,
}: FiltersSimplifiedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 100000,
  ]);

  const handleBrandToggle = (brandId: string) => {
    const current = filters.brands || [];
    const updated = current.includes(brandId)
      ? current.filter((id) => id !== brandId)
      : [...current, brandId];

    onFilterChange({ ...filters, brands: updated });
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      onFilterChange({ ...filters, category: undefined, subcategory: undefined });
    } else {
      onFilterChange({ ...filters, category: categoryId, subcategory: undefined });
    }
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    if (subcategoryId === 'all') {
      onFilterChange({ ...filters, subcategory: undefined });
    } else {
      onFilterChange({ ...filters, subcategory: subcategoryId });
    }
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

  const handleFeaturedToggle = () => {
    onFilterChange({ ...filters, featured: !filters.featured });
  };

  const handleOnSaleToggle = () => {
    onFilterChange({ ...filters, onSale: !filters.onSale });
  };

  const activeFilterCount =
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  return (
    <div className={cn('w-full', className)}>
      {/* Botón Filtros - Colapsable */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between h-12"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {/* Contenido Colapsable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-6 p-4 border rounded-lg bg-card">
              {/* Header con botón limpiar */}
              {activeFilterCount > 0 && (
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-sm text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar filtros
                  </Button>
                </div>
              )}

              {/* Precio */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Rango de precio</h4>
                </div>
                <div className="space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={handlePriceChange}
                    onValueCommit={handlePriceCommit}
                    max={100000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0].toLocaleString()}</span>
                    <span>${priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
                <Separator />
              </div>

              {/* Categorías (solo si NO hay categoría seleccionada en navbar) */}
              {!filters.category && categories.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Categorías</h4>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const isChecked = filters.category === category._id;
                        return (
                          <div key={category._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${category._id}`}
                              checked={isChecked}
                              onCheckedChange={() => handleCategoryChange(category._id)}
                            />
                            <Label
                              htmlFor={`cat-${category._id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {category.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <Separator />
                </div>
              )}

              {/* Subcategorías (si hay categoría seleccionada) */}
              {subcategories.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Subcategorías</h4>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {subcategories.map((subcat) => {
                        const isChecked = filters.subcategory === subcat._id;
                        return (
                          <div key={subcat._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`subcat-${subcat._id}`}
                              checked={isChecked}
                              onCheckedChange={() => handleSubcategoryChange(subcat._id)}
                            />
                            <Label
                              htmlFor={`subcat-${subcat._id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {subcat.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <Separator />
                </div>
              )}

              {/* Marcas */}
              {brands.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">Marcas</h4>
                    </div>
                    {filters.brands && filters.brands.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {filters.brands.length}
                      </Badge>
                    )}
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {brands.map((brand) => {
                        const isChecked = filters.brands?.includes(brand._id) || false;
                        return (
                          <div key={brand._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`brand-${brand._id}`}
                              checked={isChecked}
                              onCheckedChange={() => handleBrandToggle(brand._id)}
                            />
                            <Label
                              htmlFor={`brand-${brand._id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {brand.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <Separator />
                </div>
              )}

              {/* Especiales */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Especiales</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={filters.featured || false}
                      onCheckedChange={handleFeaturedToggle}
                    />
                    <Label
                      htmlFor="featured"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Productos destacados
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onSale"
                      checked={filters.onSale || false}
                      onCheckedChange={handleOnSaleToggle}
                    />
                    <Label
                      htmlFor="onSale"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Con descuento
                    </Label>
                  </div>
                </div>
              </div>

              {/* Resumen */}
              {productCount !== undefined && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="font-semibold text-foreground">{productCount}</span>{' '}
                    {productCount === 1 ? 'producto encontrado' : 'productos encontrados'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
