'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriesHierarchical } from '@/hooks/useCategories';
import type { Category } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';

interface CategoryWithSubcategorySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function CategoryWithSubcategorySelector({
  selectedIds,
  onChange,
  disabled = false,
}: CategoryWithSubcategorySelectorProps) {
  const { data: mainCategories, isLoading } = useCategoriesHierarchical();
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  // Update subcategories when main category changes
  useEffect(() => {
    if (selectedMainCategory && mainCategories) {
      const category = mainCategories.find((cat: CategoryWithSubcategories) => cat._id === selectedMainCategory);
      setSubcategories(category?.subcategories || []);
    } else {
      setSubcategories([]);
    }
  }, [selectedMainCategory, mainCategories]);

  // Auto-select main category if a subcategory is already selected
  useEffect(() => {
    if (selectedIds.length > 0 && mainCategories) {
      // Find if any selected ID is a subcategory
      for (const mainCat of mainCategories) {
        const hasSelectedSubcat = mainCat.subcategories?.some((subcat: Category) =>
          selectedIds.includes(subcat._id)
        );
        if (hasSelectedSubcat) {
          setSelectedMainCategory(mainCat._id);
          break;
        }
        // Check if main category itself is selected
        if (selectedIds.includes(mainCat._id)) {
          setSelectedMainCategory(mainCat._id);
          break;
        }
      }
    }
  }, [selectedIds, mainCategories]);

  const handleMainCategoryToggle = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter(id => id !== categoryId));
    } else {
      onChange([...selectedIds, categoryId]);
    }
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    if (selectedIds.includes(subcategoryId)) {
      onChange(selectedIds.filter(id => id !== subcategoryId));
    } else {
      onChange([...selectedIds, subcategoryId]);
    }
  };

  const handleMainCategorySelect = (categoryId: string) => {
    setSelectedMainCategory(categoryId);
  };

  // Get all selected categories (both main and sub) for display
  const getSelectedCategoryNames = (): string[] => {
    if (!mainCategories) return [];

    const names: string[] = [];
    for (const mainCat of mainCategories) {
      if (selectedIds.includes(mainCat._id)) {
        names.push(mainCat.name);
      }
      if (mainCat.subcategories) {
        for (const subcat of mainCat.subcategories) {
          if (selectedIds.includes(subcat._id)) {
            names.push(`${mainCat.name} > ${subcat.name}`);
          }
        }
      }
    }
    return names;
  };

  const selectedNames = getSelectedCategoryNames();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Label>Categorías *</Label>

      {/* Main Categories Selector */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">1. Selecciona categoría principal</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={disabled}
              className="w-full justify-between"
            >
              {selectedMainCategory ? (
                <span className="truncate">
                  {mainCategories?.find((cat: CategoryWithSubcategories) => cat._id === selectedMainCategory)?.name}
                </span>
              ) : (
                "Selecciona categoría principal..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar categoría..." />
              <CommandEmpty>No se encontraron categorías.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {mainCategories?.map((category: CategoryWithSubcategories) => (
                  <CommandItem
                    key={category._id}
                    value={category.name}
                    onSelect={() => handleMainCategorySelect(category._id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(category._id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span>{category.name}</span>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMainCategoryToggle(category._id);
                      }}
                      className={cn(
                        "ml-2 px-2 py-1 text-xs rounded",
                        selectedIds.includes(category._id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {selectedIds.includes(category._id) ? "Incluida" : "Incluir"}
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Subcategories Selector */}
      {selectedMainCategory && subcategories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">2. Selecciona subcategorías (opcional)</Label>
          <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
            {subcategories.map((subcat) => (
              <div
                key={subcat._id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors",
                  selectedIds.includes(subcat._id) && "bg-muted"
                )}
                onClick={() => handleSubcategoryToggle(subcat._id)}
              >
                <div className="flex items-center gap-2">
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedIds.includes(subcat._id) ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  <span className="text-sm">{subcat.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Categories Display */}
      {selectedNames.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Categorías seleccionadas:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedNames.map((name, index) => {
              // Find the ID for this name
              const isMainCategory = !name.includes(' > ');
              let categoryId = '';

              if (isMainCategory) {
                categoryId = mainCategories?.find((cat: CategoryWithSubcategories) => cat.name === name)?._id || '';
              } else {
                const [mainName, subName] = name.split(' > ');
                const mainCat = mainCategories?.find((cat: CategoryWithSubcategories) => cat.name === mainName);
                categoryId = mainCat?.subcategories?.find((sub: Category) => sub.name === subName)?._id || '';
              }

              return (
                <Badge key={index} variant="secondary">
                  {name}
                  <button
                    onClick={() => {
                      if (isMainCategory) {
                        handleMainCategoryToggle(categoryId);
                      } else {
                        handleSubcategoryToggle(categoryId);
                      }
                    }}
                    disabled={disabled}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
