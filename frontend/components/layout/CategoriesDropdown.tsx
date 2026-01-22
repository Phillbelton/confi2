'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Grid3x3, Package, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMainCategories } from '@/hooks/useCategories';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { cn } from '@/lib/utils';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import type { Category } from '@/types';

export function CategoriesDropdown() {
  const { data: mainCategories, isLoading } = useMainCategories();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        className="h-10 px-4 bg-secondary text-white hover:bg-secondary/80"
      >
        <Grid3x3 className="h-5 w-5 mr-2" />
        Categorías
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 px-4 bg-secondary text-white hover:bg-secondary/80 gap-2"
        >
          <Grid3x3 className="h-5 w-5" />
          <span className="font-medium">Categorías</span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[800px] p-0 bg-white border-0 shadow-2xl rounded-lg overflow-hidden"
      >
        <div className="grid grid-cols-12 min-h-[400px]">
          {/* Main Categories - Left Column */}
          <div className="col-span-4 bg-gray-50 border-r border-gray-200">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Todas las categorías
              </h3>
              <nav className="space-y-1">
                {/* Ver Todos los Productos */}
                <Link
                  href="/productos"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-primary/10 hover:bg-primary/20 border border-primary/20"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm text-primary">
                    Ver todos los productos
                  </span>
                </Link>

                {/* Separator */}
                <div className="h-px bg-gray-200 my-2" />

                {mainCategories?.map((category: CategoryWithSubcategories) => {
                  const config = getCategoryVisualConfig(category.name);
                  const isHovered = hoveredCategory === category._id;

                  return (
                    <div
                      key={category._id}
                      onMouseEnter={() => setHoveredCategory(category._id)}
                      className="relative"
                    >
                      <Link
                        href={`/productos?categoria=${category._id}`}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all',
                          'hover:bg-white hover:shadow-sm text-gray-700 hover:text-gray-900',
                          isHovered && 'bg-white shadow-sm text-gray-900'
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={cn(
                              'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg',
                              config.gradient
                            )}
                          >
                            {config.emoji}
                          </div>
                          <span className="font-medium text-sm truncate">
                            {category.name}
                          </span>
                        </div>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        )}
                      </Link>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Subcategories - Right Column */}
          <div className="col-span-8 bg-white">
            <AnimatePresence mode="wait">
              {hoveredCategory ? (
                <motion.div
                  key={hoveredCategory}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6"
                >
                  {(() => {
                    const category = mainCategories?.find(
                      (c: CategoryWithSubcategories) => c._id === hoveredCategory
                    );
                    if (!category?.subcategories || category.subcategories.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <p className="text-sm">No hay subcategorías disponibles</p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900">
                          {category.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {category.subcategories.map((subcat: Category) => {
                            const config = getCategoryVisualConfig(subcat.name);

                            return (
                              <Link
                                key={subcat._id}
                                href={`/productos?categoria=${category._id}&subcategoria=${subcat._id}`}
                                onClick={() => setOpen(false)}
                                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div
                                  className={cn(
                                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg',
                                    'group-hover:scale-110 transition-transform',
                                    config.gradient
                                  )}
                                >
                                  {config.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors">
                                    {subcat.name}
                                  </p>
                                  {subcat.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                      {subcat.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full text-gray-400 p-6"
                >
                  <div className="text-center">
                    <Grid3x3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">
                      Pasa el cursor sobre una categoría para ver sus subcategorías
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
