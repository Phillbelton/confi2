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
  selectedSubcategories?: string[];
  selectedBrands?: string[];
  priceRange?: [number, number];
  hasPromotion?: boolean;
  onCategoryChange?: (categoryId: string | undefined, subcategoryIds?: string[]) => void;
  onBrandChange?: (brandIds: string[]) => void;
  onPriceChange?: (range: [number, number]) => void;
  onPromotionChange?: (hasPromotion: boolean) => void;
  onClearFilters?: () => void;
  onApplyFilters?: () => void;
  maxPrice?: number;
  className?: string;
  /** Hide the internal header (used when embedded in Sheet with its own header) */
  hideHeader?: boolean;
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
          <div className="w-7 h-7 rounded-[10px] bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            {icon}
          </div>
          <span className="font-display font-semibold text-sm text-foreground group-hover:text-foreground transition-colors">
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/15 text-primary shadow-sm">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground group-hover:text-muted-foreground transition-all duration-200',
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
      {/* Section separator */}
      <div className="border-b border-border" />
    </div>
  );
}

export function FiltersSidebarCentral({
  selectedCategory,
  selectedSubcategories = [],
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
  hideHeader = false,
}: FiltersSidebarCentralProps) {
  const { data: categories } = useMainCategories();
  const { data: brands } = useBrands();

  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    selectedSubcategories.length +
    selectedBrands.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (hasPromotion ? 1 : 0);

  return (
    <aside className={cn('bg-card rounded-lg border border-border shadow-sm overflow-hidden', className)}>
      {/* Header — hidden when inside mobile Sheet */}
      {!hideHeader && (
        <div className="px-4 py-3 bg-muted border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-foreground text-sm">Filtros</span>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={onClearFilters}
                className="rounded-full px-2.5 py-1 text-[11px] text-primary hover:text-foreground font-medium"
              >
                Limpiar ({activeFilters})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pt-1">
        {/* 1. Price — only section open by default */}
        <CollapsibleSection
          title="Precio"
          icon={<DollarSign className="h-3.5 w-3.5 text-primary" />}
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
              <div className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-center">
                <span className="text-xs text-muted-foreground font-medium" suppressHydrationWarning>
                  ${localPriceRange[0].toLocaleString('es-CL')}
                </span>
              </div>
              <div className="w-3 h-px bg-border" />
              <div className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-center">
                <span className="text-xs text-muted-foreground font-medium" suppressHydrationWarning>
                  ${localPriceRange[1].toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 2. Categories — collapsed by default */}
        <CollapsibleSection
          title="Categorías"
          icon={<Layers className="h-3.5 w-3.5 text-primary" />}
          badge={selectedCategory ? 1 : 0}
          defaultOpen={false}
        >
          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
            {mounted && categories?.map((category: Category & { subcategories?: Category[] }) => {
              const isSelected = selectedCategory === category._id;
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;
              const isExpanded = expandedCategories.includes(category._id);

              return (
                <div key={category._id}>
                  <div className="flex items-center">
                    {hasSubcategories && (
                      <button
                        onClick={() => toggleCategoryExpand(category._id)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
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
                      onClick={() => {
                        if (isSelected) {
                          onCategoryChange?.(undefined);
                        } else {
                          // Select this category, collapse all others
                          setExpandedCategories([category._id]);
                          onCategoryChange?.(category._id);
                        }
                      }}
                      className={cn(
                        'flex-1 text-left py-2.5 px-2.5 rounded-xl text-sm transition-all duration-150',
                        isSelected
                          ? 'bg-white text-primary font-semibold border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {category.name}
                    </button>
                  </div>

                  {hasSubcategories && isExpanded && (
                    <div className="ml-5 pl-3 border-l border-border space-y-0.5 my-1">
                      {category.subcategories?.map((subcat: Category) => {
                        const isSubSelected = selectedSubcategories.includes(subcat._id);
                        const toggleSub = () => {
                          const newSubs = isSubSelected
                            ? selectedSubcategories.filter(id => id !== subcat._id)
                            : [...selectedSubcategories, subcat._id];
                          // Keep only this category expanded
                          setExpandedCategories([category._id]);
                          onCategoryChange?.(category._id, newSubs.length > 0 ? newSubs : undefined);
                        };
                        return (
                          <button
                            key={subcat._id}
                            onClick={toggleSub}
                            className={cn(
                              'w-full text-left py-2.5 px-2.5 rounded-xl text-sm transition-all duration-150',
                              isSubSelected
                                ? 'bg-white text-primary font-medium border border-primary/30'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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

        {/* 3. Brands — collapsed by default */}
        <CollapsibleSection
          title="Marca"
          icon={<Tag className="h-3.5 w-3.5 text-primary" />}
          badge={selectedBrands.length}
          defaultOpen={false}
        >
          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
            {mounted && brands?.map((brand: Brand) => (
              <label
                key={brand._id}
                className={cn(
                  'flex items-center gap-3 cursor-pointer group px-2 py-2.5 rounded-xl transition-all duration-150',
                  selectedBrands.includes(brand._id)
                    ? 'bg-white border border-primary/30'
                    : 'hover:bg-muted'
                )}
              >
                <Checkbox
                  checked={selectedBrands.includes(brand._id)}
                  onCheckedChange={() => handleBrandToggle(brand._id)}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-[6px]"
                />
                <span className={cn(
                  'text-sm transition-colors',
                  selectedBrands.includes(brand._id)
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}>
                  {brand.name}
                </span>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        {/* 4. Promotions — last, collapsed by default */}
        <CollapsibleSection
          title="Ofertas"
          icon={<Gift className="h-3.5 w-3.5 text-primary" />}
          badge={hasPromotion ? 1 : 0}
          defaultOpen={false}
        >
          <label className="flex items-center gap-3 cursor-pointer group px-2 py-2.5 rounded-xl hover:bg-muted transition-colors">
            <Checkbox
              checked={hasPromotion}
              onCheckedChange={(checked) => onPromotionChange?.(checked as boolean)}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-[6px]"
            />
            <span className="text-sm text-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Solo con descuento
            </span>
          </label>
        </CollapsibleSection>
      </div>

    </aside>
  );
}
