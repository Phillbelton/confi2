'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Grid3x3, Package, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoriesDropdownProps {
  /** Base path para los links. Default: '/productos'. Para shell /m/ pasar '/m/productos'. */
  basePath?: string;
  /** Si true, las URLs usan `slug` en vez de `_id`. Default: false. */
  useSlug?: boolean;
}

/**
 * Mega-menú de 3 niveles estilo Jumbo:
 * - Sidebar izquierda: categorías raíz (L1)
 * - Panel derecho al hover: subcategorías L2 como grupos, con L3 listadas debajo de cada L2.
 */
export function CategoriesDropdown({
  basePath = '/productos',
  useSlug = false,
}: CategoriesDropdownProps = {}) {
  const { data: allCategories, isLoading } = useCategories();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Construir jerarquía 3-niveles: L1 → L2 → L3
  const tree = useMemo(() => {
    const cats: Category[] = (allCategories as Category[]) || [];
    const parentIdOf = (c: Category) =>
      typeof c.parent === 'string' ? c.parent : c.parent?._id;

    const roots = cats.filter((c) => !c.parent && c.active);
    return roots.map((root) => {
      const l2 = cats.filter((c) => c.active && parentIdOf(c) === root._id);
      const l2WithChildren = l2.map((sub) => ({
        ...sub,
        children: cats.filter((c) => c.active && parentIdOf(c) === sub._id),
      }));
      return { ...root, l2: l2WithChildren };
    });
  }, [allCategories]);

  const catParam = (c: { _id: string; slug: string }) => useSlug ? c.slug : c._id;

  // Auto-hover primer item al abrir
  const firstId = tree[0]?._id;
  const activeId = hoveredId || firstId || null;
  const activeRoot = tree.find((r) => r._id === activeId);

  if (isLoading) {
    return (
      <Button variant="ghost" className="h-10 px-4 bg-secondary text-white hover:bg-secondary/80">
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
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[min(960px,calc(100vw-2rem))] p-0 bg-white border-0 shadow-2xl rounded-lg overflow-hidden"
      >
        <div className="grid grid-cols-12 min-h-[420px] max-h-[70vh]">
          {/* SIDEBAR — Categorías L1 */}
          <div className="col-span-4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">
                Todas las categorías
              </h3>
              <nav className="space-y-0.5">
                <Link
                  href={basePath}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 mb-2"
                >
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm text-primary">Ver todos los productos</span>
                </Link>
                {tree.map((root) => {
                  const config = getCategoryVisualConfig(root.name);
                  const isActive = activeId === root._id;
                  return (
                    <div
                      key={root._id}
                      onMouseEnter={() => setHoveredId(root._id)}
                      className="relative"
                    >
                      <Link
                        href={`${basePath}?categoria=${catParam(root)}`}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all',
                          'hover:bg-white hover:shadow-sm',
                          isActive ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={cn(
                            'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-base',
                            config.gradient
                          )}>
                            {config.emoji}
                          </div>
                          <span className="text-sm truncate">{root.name}</span>
                        </div>
                        {root.l2.length > 0 && (
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        )}
                      </Link>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* PANEL DERECHO — L2 + L3 */}
          <div className="col-span-8 bg-white overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeRoot ? (
                <motion.div
                  key={activeRoot._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  className="p-5"
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <Link
                      href={`${basePath}?categoria=${catParam(activeRoot)}`}
                      onClick={() => setOpen(false)}
                      className="text-base font-bold text-gray-900 hover:text-primary inline-flex items-center gap-2"
                    >
                      <span className="text-lg">{getCategoryVisualConfig(activeRoot.name).emoji}</span>
                      {activeRoot.name}
                    </Link>
                    <Link
                      href={`${basePath}?categoria=${catParam(activeRoot)}`}
                      onClick={() => setOpen(false)}
                      className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Mostrar todo <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {activeRoot.l2.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      Esta categoría no tiene subcategorías. <Link href={`${basePath}?categoria=${catParam(activeRoot)}`} className="text-primary hover:underline" onClick={() => setOpen(false)}>Ver productos</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                      {activeRoot.l2.map((sub) => (
                        <div key={sub._id} className="min-w-0">
                          <Link
                            href={`${basePath}?categoria=${catParam(sub)}`}
                            onClick={() => setOpen(false)}
                            className="block text-sm font-bold text-gray-900 hover:text-primary mb-1.5"
                          >
                            {sub.name}
                          </Link>
                          {sub.children.length > 0 && (
                            <ul className="space-y-1">
                              {sub.children.map((leaf) => (
                                <li key={leaf._id}>
                                  <Link
                                    href={`${basePath}?categoria=${catParam(leaf)}`}
                                    onClick={() => setOpen(false)}
                                    className="text-xs text-gray-600 hover:text-primary block truncate"
                                  >
                                    {leaf.name}
                                  </Link>
                                </li>
                              ))}
                              {sub.children.length >= 6 && (
                                <li>
                                  <Link
                                    href={`${basePath}?categoria=${catParam(sub)}`}
                                    onClick={() => setOpen(false)}
                                    className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                                  >
                                    Mostrar todo <ChevronRight className="h-3 w-3" />
                                  </Link>
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 p-6">
                  <div className="text-center">
                    <Grid3x3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Pasá el cursor sobre una categoría</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
