'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Package } from 'lucide-react';
import { useMainCategories } from '@/hooks/useCategories';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { cn } from '@/lib/utils';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import type { Category } from '@/types';
import { SheetClose } from '@/components/ui/sheet';

interface MobileCategoriesNavProps {
  onNavigate?: () => void;
}

export function MobileCategoriesNav({ onNavigate }: MobileCategoriesNavProps) {
  const { data: mainCategories, isLoading } = useMainCategories();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <nav className="space-y-1">
      {/* Ver Todos los Productos */}
      <SheetClose asChild>
        <Link
          href="/productos"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-white">
            Ver todos los productos
          </span>
        </Link>
      </SheetClose>

      {/* Separator */}
      <div className="h-px bg-white/10 my-3" />

      {/* Categories List */}
      {mainCategories?.map((category: CategoryWithSubcategories) => {
        const config = getCategoryVisualConfig(category.name);
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        const isExpanded = expandedCategories.includes(category._id);

        return (
          <div key={category._id} className="space-y-1">
            <div className="flex items-center">
              {/* Main Category Link */}
              <SheetClose asChild>
                <Link
                  href={`/productos?categoria=${category._id}`}
                  onClick={onNavigate}
                  className="flex-1 flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-lg',
                      config.gradient
                    )}
                  >
                    {config.emoji}
                  </div>
                  <span className="font-medium text-sm text-white truncate">
                    {category.name}
                  </span>
                </Link>
              </SheetClose>

              {/* Expand Button */}
              {hasSubcategories && (
                <button
                  onClick={() => toggleCategory(category._id)}
                  className="p-3 text-gray-400 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {/* Subcategories */}
            {hasSubcategories && isExpanded && (
              <div className="ml-6 pl-5 border-l border-white/10 space-y-1">
                {category.subcategories?.map((subcat: Category) => {
                  const subcatConfig = getCategoryVisualConfig(subcat.name);

                  return (
                    <SheetClose key={subcat._id} asChild>
                      <Link
                        href={`/productos?categoria=${category._id}&subcategoria=${subcat._id}`}
                        onClick={onNavigate}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-md flex items-center justify-center text-sm',
                            subcatConfig.gradient
                          )}
                        >
                          {subcatConfig.emoji}
                        </div>
                        <span className="text-sm text-gray-300 hover:text-white">
                          {subcat.name}
                        </span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
