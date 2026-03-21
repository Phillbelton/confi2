'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Tag, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useCategories, useMainCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import type { Category, Brand } from '@/types';

interface FiltersSidebarCentralProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  selectedBrands?: string[];
  priceRange?: [number, number];
  hasPromotion?: boolean;
  onCategoryChange?: (categoryId: string | undefined, subcategoryId?: string) => void;
  onBrandChange?: (brandIds: string[]) => void;
  onPriceChange?: (range: [number, number]) => void;
  onPromotionChange?: (hasPromotion: boolean) => void;
  onClearFilters?: () => void;
  onApplyFilters?: () => void;
  maxPrice?: number;
  className?: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left text-white hover:text-gray-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function FiltersSidebarCentral({
  selectedCategory,
  selectedSubcategory,
  selectedBrands = [],
  priceRange = [0, 100000],
  hasPromotion = false,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onPromotionChange,
  onClearFilters,
  onApplyFilters,
  maxPrice = 100000,
  className,
}: FiltersSidebarCentralProps) {
  const { data: categories } = useMainCategories();
  const { data: brands } = useBrands();

  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleBrandToggle = (brandId: string) => {
    const newBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter(id => id !== brandId)
      : [...selectedBrands, brandId];
    onBrandChange?.(newBrands);
  };

  const handlePriceCommit = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setLocalPriceRange(range);
    onPriceChange?.(range);
  };

  return (
    <aside className={cn('bg-[#1a1a2e] rounded-lg p-4', className)}>
      {/* Price Filter */}
      <CollapsibleSection title="Precio" icon={<span className="text-gray-400">$</span>}>
        <div className="space-y-4 px-1">
          <Slider
            value={localPriceRange}
            min={0}
            max={maxPrice}
            step={1000}
            onValueChange={(value) => setLocalPriceRange([value[0], value[1]])}
            onValueCommit={handlePriceCommit}
            className="py-2"
          />
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>${localPriceRange[0].toLocaleString('es-CL')}</span>
            <span>${localPriceRange[1].toLocaleString('es-CL')}</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Promotions */}
      <CollapsibleSection title="Promociones" icon={<Gift className="h-4 w-4 text-gray-400" />}>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={hasPromotion}
              onCheckedChange={(checked) => onPromotionChange?.(checked as boolean)}
              className="border-gray-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Solo con descuento
            </span>
          </label>
        </div>
      </CollapsibleSection>

      {/* Categories */}
      <CollapsibleSection title="Categorías" icon={<Tag className="h-4 w-4 text-gray-400" />}>
        <div className="space-y-1 max-h-48 sm:max-h-64 overflow-y-auto scrollbar-hide">
          {categories?.map((category: Category & { subcategories?: Category[] }) => {
            const isSelected = selectedCategory === category._id;
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            const isExpanded = expandedCategories.includes(category._id);

            return (
              <div key={category._id}>
                <div className="flex items-center">
                  {hasSubcategories && (
                    <button
                      onClick={() => toggleCategoryExpand(category._id)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </button>
                  )}
                  <button
                    onClick={() => onCategoryChange?.(isSelected ? undefined : category._id)}
                    className={cn(
                      'flex-1 text-left py-2 px-2 rounded text-sm transition-colors',
                      isSelected
                        ? 'text-primary font-medium'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {category.name}
                  </button>
                </div>

                {/* Subcategories */}
                {hasSubcategories && isExpanded && (
                  <div className="ml-6 space-y-1">
                    {category.subcategories?.map((subcat: Category) => {
                      const isSubSelected = selectedSubcategory === subcat._id;
                      return (
                        <button
                          key={subcat._id}
                          onClick={() => onCategoryChange?.(category._id, isSubSelected ? undefined : subcat._id)}
                          className={cn(
                            'w-full text-left py-1.5 px-2 rounded text-sm transition-colors',
                            isSubSelected
                              ? 'text-primary font-medium'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {subcat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Brands */}
      <CollapsibleSection title="Marca" icon={<Tag className="h-4 w-4 text-gray-400" />}>
        <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto scrollbar-hide">
          {brands?.map((brand: Brand) => (
            <label
              key={brand._id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={selectedBrands.includes(brand._id)}
                onCheckedChange={() => handleBrandToggle(brand._id)}
                className="border-gray-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6">
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          Limpiar
        </Button>
        <Button
          onClick={onApplyFilters}
          className="flex-1 bg-primary hover:bg-primary/90 text-white"
        >
          Aplicar
        </Button>
      </div>
    </aside>
  );
}
