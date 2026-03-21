'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Sparkles,
  Tag,
  Layers,
  X,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ProductFilters as Filters, Brand, Category } from '@/types';

interface FiltersAsideProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClearFilters: () => void;
  brands: Brand[];
  categories?: Category[];
  subcategories?: Category[];
  productCount?: number;
  className?: string;
}

interface CollapsibleSection {
  id: string;
  isOpen: boolean;
}

export function FiltersAside({
  filters,
  onFilterChange,
  onClearFilters,
  brands,
  categories = [],
  subcategories = [],
  productCount,
  className,
}: FiltersAsideProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 100000,
  ]);

  // Secciones colapsables - Solo precio abierto por defecto
  const [sections, setSections] = useState<CollapsibleSection[]>([
    { id: 'price', isOpen: true },
    { id: 'categories', isOpen: false },
    { id: 'brands', isOpen: false },
    { id: 'specials', isOpen: false },
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  const isSectionOpen = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.isOpen || false;
  };

  const handleBrandToggle = (brandId: string) => {
    const current = filters.brands || [];
    const updated = current.includes(brandId)
      ? current.filter((id) => id !== brandId)
      : [...current, brandId];

    onFilterChange({ ...filters, brands: updated });
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === filters.category) {
      // Si es la misma, deseleccionar
      onFilterChange({ ...filters, category: undefined, subcategory: undefined });
    } else {
      onFilterChange({ ...filters, category: categoryId, subcategory: undefined });
    }
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    if (subcategoryId === filters.subcategory) {
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
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  const SectionHeader = ({
    icon: Icon,
    title,
    sectionId,
    count
  }: {
    icon: any;
    title: string;
    sectionId: string;
    count?: number;
  }) => {
    const isOpen = isSectionOpen(sectionId);

    return (
      <button
        onClick={() => toggleSection(sectionId)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">{title}</h4>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {count}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
    );
  };

  return (
    <aside className={cn('bg-card border rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Filtros
          </h3>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filters Container */}
      <ScrollArea className="max-h-[calc(100vh-200px)]">
        <div className="p-4 space-y-6">

          {/* PRECIO - Siempre primero */}
          <div className="space-y-3">
            <SectionHeader
              icon={DollarSign}
              title="Rango de precio"
              sectionId="price"
            />

            <AnimatePresence>
              {isSectionOpen('price') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  <Slider
                    value={priceRange}
                    onValueChange={handlePriceChange}
                    onValueCommit={handlePriceCommit}
                    max={100000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-medium text-center">
                      ${priceRange[0].toLocaleString()}
                    </div>
                    <span className="text-muted-foreground">-</span>
                    <div className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-medium text-center">
                      ${priceRange[1].toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* CATEGORÍAS */}
          {categories.length > 0 && (
            <>
              <div className="space-y-3">
                <SectionHeader
                  icon={Tag}
                  title="Categorías"
                  sectionId="categories"
                  count={filters.category ? 1 : 0}
                />

                <AnimatePresence>
                  {isSectionOpen('categories') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <ScrollArea className="max-h-[200px]">
                        <div className="space-y-1.5">
                          {categories.map((category) => {
                            const isSelected = filters.category === category._id;

                            return (
                              <div key={category._id}>
                                <div
                                  className={cn(
                                    'flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                                    isSelected
                                      ? 'bg-primary/10 text-primary'
                                      : 'hover:bg-muted'
                                  )}
                                  onClick={() => handleCategoryChange(category._id)}
                                >
                                  <Checkbox
                                    id={`category-${category._id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => handleCategoryChange(category._id)}
                                  />
                                  <Label
                                    htmlFor={`category-${category._id}`}
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    {category.name}
                                  </Label>
                                </div>

                                {/* Subcategorías si la categoría está seleccionada */}
                                {isSelected && subcategories.length > 0 && (
                                  <div className="ml-6 mt-1 space-y-1">
                                    {subcategories.map((subcat) => {
                                      const isSubSelected = filters.subcategory === subcat._id;

                                      return (
                                        <div
                                          key={subcat._id}
                                          className={cn(
                                            'flex items-center space-x-2 px-2 py-1 rounded-md cursor-pointer transition-colors text-sm',
                                            isSubSelected
                                              ? 'bg-primary/10 text-primary'
                                              : 'hover:bg-muted'
                                          )}
                                          onClick={() => handleSubcategoryToggle(subcat._id)}
                                        >
                                          <Checkbox
                                            id={`subcat-${subcat._id}`}
                                            checked={isSubSelected}
                                            onCheckedChange={() => handleSubcategoryToggle(subcat._id)}
                                          />
                                          <Label
                                            htmlFor={`subcat-${subcat._id}`}
                                            className="text-xs font-normal cursor-pointer flex-1"
                                          >
                                            {subcat.name}
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator />
            </>
          )}

          {/* MARCAS */}
          {brands.length > 0 && (
            <>
              <div className="space-y-3">
                <SectionHeader
                  icon={Tag}
                  title="Marcas"
                  sectionId="brands"
                  count={filters.brands?.length}
                />

                <AnimatePresence>
                  {isSectionOpen('brands') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ScrollArea className="max-h-[240px]">
                        <div className="space-y-1.5">
                          {brands.map((brand) => {
                            const isChecked = filters.brands?.includes(brand._id) || false;

                            return (
                              <div
                                key={brand._id}
                                className={cn(
                                  'flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                                  isChecked
                                    ? 'bg-primary/10'
                                    : 'hover:bg-muted'
                                )}
                                onClick={() => handleBrandToggle(brand._id)}
                              >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator />
            </>
          )}

          {/* ESPECIALES */}
          <div className="space-y-3">
            <SectionHeader
              icon={Sparkles}
              title="Especiales"
              sectionId="specials"
              count={(filters.featured ? 1 : 0) + (filters.onSale ? 1 : 0)}
            />

            <AnimatePresence>
              {isSectionOpen('specials') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-hidden"
                >
                  {/* Destacados */}
                  <div
                    className={cn(
                      'flex items-center space-x-2 px-2 py-2 rounded-md cursor-pointer transition-colors',
                      filters.featured
                        ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                        : 'hover:bg-muted'
                    )}
                    onClick={handleFeaturedToggle}
                  >
                    <Checkbox
                      id="featured"
                      checked={filters.featured || false}
                      onCheckedChange={handleFeaturedToggle}
                    />
                    <Label
                      htmlFor="featured"
                      className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      Productos destacados
                    </Label>
                  </div>

                  {/* Descuentos escalonados (Mayorista) */}
                  <div
                    className={cn(
                      'flex items-center space-x-2 px-2 py-2 rounded-md cursor-pointer transition-colors',
                      filters.onSale
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                        : 'hover:bg-muted'
                    )}
                    onClick={handleOnSaleToggle}
                  >
                    <Checkbox
                      id="onSale"
                      checked={filters.onSale || false}
                      onCheckedChange={handleOnSaleToggle}
                    />
                    <Label
                      htmlFor="onSale"
                      className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                      Descuentos mayoristas
                    </Label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* Footer - Product Count */}
      {productCount !== undefined && (
        <div className="p-4 border-t bg-muted/30">
          <p className="text-sm text-center">
            <span className="font-bold text-primary">{productCount}</span>{' '}
            <span className="text-muted-foreground">
              {productCount === 1 ? 'producto encontrado' : 'productos encontrados'}
            </span>
          </p>
        </div>
      )}
    </aside>
  );
}
