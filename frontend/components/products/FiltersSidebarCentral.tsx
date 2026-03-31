'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Tag, Gift, DollarSign, Layers, Sparkles } from 'lucide-react';
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
  badge?: number;
}

function CollapsibleSection({ title, icon, defaultOpen = true, children, badge }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left group transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[10px] jc-well flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            {icon}
          </div>
          <span className="font-display font-semibold text-sm text-white/90 group-hover:text-white transition-colors">
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/25 text-cyan-200 shadow-sm">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white/40 group-hover:text-white/70 transition-all duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100 pb-3' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
      {/* Joy-Con groove separator */}
      <div className="jc-groove" />
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

  useEffect(() => {
    if (selectedCategory && !expandedCategories.includes(selectedCategory)) {
      setExpandedCategories(prev => [...prev, selectedCategory]);
    }
  }, [selectedCategory]);

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

  const activeFilters =
    (selectedCategory ? 1 : 0) +
    (selectedSubcategory ? 1 : 0) +
    selectedBrands.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (hasPromotion ? 1 : 0);

  return (
    <aside className={cn('jc-panel overflow-hidden', className)}>
      {/* Header — raised bumper feel */}
      <div className="px-4 py-3 bg-white/[0.04] border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span className="font-display font-bold text-white text-sm">Filtros</span>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={onClearFilters}
              className="jc-pill px-2.5 py-1 text-[11px] text-cyan-300 hover:text-white font-medium"
            >
              Limpiar ({activeFilters})
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-1">
        {/* Price */}
        <CollapsibleSection
          title="Precio"
          icon={<DollarSign className="h-3.5 w-3.5 text-cyan-300" />}
          badge={priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0}
        >
          <div className="space-y-3 px-1">
            <Slider
              value={localPriceRange}
              min={0}
              max={maxPrice}
              step={1000}
              onValueChange={(value) => setLocalPriceRange([value[0], value[1]])}
              onValueCommit={handlePriceCommit}
              className="py-2"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 jc-well px-3 py-1.5 text-center">
                <span className="text-xs text-white/70 font-medium">
                  ${localPriceRange[0].toLocaleString('es-CL')}
                </span>
              </div>
              <div className="w-3 h-px bg-white/15" />
              <div className="flex-1 jc-well px-3 py-1.5 text-center">
                <span className="text-xs text-white/70 font-medium">
                  ${localPriceRange[1].toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Promotions */}
        <CollapsibleSection
          title="Ofertas"
          icon={<Gift className="h-3.5 w-3.5 text-cyan-300" />}
          badge={hasPromotion ? 1 : 0}
        >
          <label className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
            <Checkbox
              checked={hasPromotion}
              onCheckedChange={(checked) => onPromotionChange?.(checked as boolean)}
              className="border-white/25 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-[6px]"
            />
            <span className="text-sm text-white/70 group-hover:text-white transition-colors flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Solo con descuento
            </span>
          </label>
        </CollapsibleSection>

        {/* Categories */}
        <CollapsibleSection
          title="Categorías"
          icon={<Layers className="h-3.5 w-3.5 text-cyan-300" />}
          badge={selectedCategory ? 1 : 0}
        >
          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
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
                        className="p-1.5 text-white/40 hover:text-white transition-colors"
                      >
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => onCategoryChange?.(isSelected ? undefined : category._id)}
                      className={cn(
                        'flex-1 text-left py-1.5 px-2.5 rounded-xl text-sm transition-all duration-150',
                        isSelected
                          ? 'text-cyan-200 jc-well !bg-primary/15 font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                      )}
                    >
                      {category.name}
                    </button>
                  </div>

                  {hasSubcategories && isExpanded && (
                    <div className="ml-5 pl-3 border-l border-white/[0.08] space-y-0.5 my-1">
                      {category.subcategories?.map((subcat: Category) => {
                        const isSubSelected = selectedSubcategory === subcat._id;
                        return (
                          <button
                            key={subcat._id}
                            onClick={() => onCategoryChange?.(category._id, isSubSelected ? undefined : subcat._id)}
                            className={cn(
                              'w-full text-left py-1.5 px-2.5 rounded-xl text-sm transition-all duration-150',
                              isSubSelected
                                ? 'text-cyan-200 bg-primary/10 font-medium'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
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
        <CollapsibleSection
          title="Marca"
          icon={<Tag className="h-3.5 w-3.5 text-cyan-300" />}
          badge={selectedBrands.length}
        >
          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
            {brands?.map((brand: Brand) => (
              <label
                key={brand._id}
                className={cn(
                  'flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-xl transition-all duration-150',
                  selectedBrands.includes(brand._id)
                    ? 'bg-primary/10'
                    : 'hover:bg-white/[0.04]'
                )}
              >
                <Checkbox
                  checked={selectedBrands.includes(brand._id)}
                  onCheckedChange={() => handleBrandToggle(brand._id)}
                  className="border-white/25 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-[6px]"
                />
                <span className={cn(
                  'text-sm transition-colors',
                  selectedBrands.includes(brand._id)
                    ? 'text-cyan-200 font-medium'
                    : 'text-white/60 group-hover:text-white'
                )}>
                  {brand.name}
                </span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Apply — Mobile */}
      <div className="px-4 py-3 border-t border-white/[0.06] lg:hidden">
        <Button
          onClick={onApplyFilters}
          className="w-full bg-primary hover:bg-primary/90 text-white font-display font-bold rounded-2xl h-11"
        >
          Aplicar filtros
        </Button>
      </div>
    </aside>
  );
}
