'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductFilters as Filters, Brand, Category } from '@/types';
import { cn } from '@/lib/utils';

interface FiltersSimplifiedProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClearFilters: () => void;
  brands: Brand[];
  subcategories?: Category[]; // Subcategorías de la categoría seleccionada
  productCount?: number;
  className?: string;
}

export function FiltersSimplified({
  filters,
  onFilterChange,
  onClearFilters,
  brands,
  subcategories = [],
  productCount,
  className,
}: FiltersSimplifiedProps) {
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

  const handleSubcategoryChange = (value: string) => {
    if (value === 'all') {
      onFilterChange({ ...filters, subcategory: undefined });
    } else {
      onFilterChange({ ...filters, subcategory: value });
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

  const activeFilterCount =
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.featured ? 1 : 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header con botón limpiar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar ({activeFilterCount})
          </Button>
        )}
      </div>

      <Separator />

      {/* Subcategorías (si hay categoría seleccionada) */}
      {subcategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Subcategoría</h4>
          </div>
          <Select
            value={filters.subcategory || 'all'}
            onValueChange={handleSubcategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las subcategorías</SelectItem>
              {subcategories.map((subcat) => (
                <SelectItem key={subcat._id} value={subcat._id}>
                  {subcat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Separator />
        </div>
      )}

      {/* Destacados */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="font-medium">Especiales</h4>
        </div>
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
            Solo productos destacados
          </Label>
        </div>
        <Separator />
      </div>

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
          <ScrollArea className="h-[200px]">
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
  );
}
