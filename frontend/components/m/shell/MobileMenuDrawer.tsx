'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  ChevronRight,
  Package,
  Tag,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useCategoriesFlat } from '@/hooks/useCategories';
import { buildCategoryTree } from '@/lib/categoryUtils';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/** Limpia prefijos técnicos tipo "Categoria-3-" del nombre visible. */
const cleanName = (name: string) => name.replace(/^Categoria-\d+-/, '');

const QUICK_LINKS = [
  { label: 'Ofertas', href: '/m/productos?onSale=true', icon: Tag },
  { label: 'Destacados', href: '/m/productos?featured=true', icon: Sparkles },
  { label: 'Novedades', href: '/m/productos?sort=newest', icon: Clock },
];

/**
 * Drawer del menú mobile — disparado por la hamburguesa del header.
 * Muestra accesos rápidos y el árbol de categorías con subcategorías
 * expandibles. Inspirado en el menú lateral de e-commerce tipo Jumbo.
 */
export function MobileMenuDrawer() {
  const { data: categories, isLoading } = useCategoriesFlat();
  const tree = buildCategoryTree((categories as Category[]) || []);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menú"
          className="tappable grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition-colors hover:bg-white/15"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[88%] max-w-sm gap-0 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 bg-gradient-to-br from-primary to-secondary px-5 py-4 text-white">
          <SheetTitle className="font-display text-lg font-bold text-white">
            Menú
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navegación: accesos rápidos y categorías de la tienda.
          </SheetDescription>
          <SheetClose
            aria-label="Cerrar menú"
            className="tappable grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Accesos rápidos */}
          <nav className="p-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <SheetClose key={link.href} asChild>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {link.label}
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                </SheetClose>
              );
            })}
          </nav>

          <div className="mx-5 h-px bg-border" />

          {/* Categorías */}
          <p className="px-5 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Todas las categorías
          </p>
          <nav className="p-2 pb-8">
            <SheetClose asChild>
              <Link
                href="/m/productos"
                className="mb-1 flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-3 transition-colors hover:bg-primary/20"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Package className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-primary">
                  Ver todos los productos
                </span>
              </Link>
            </SheetClose>

            {isLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="my-1 h-14 animate-pulse rounded-xl bg-muted"
                  />
                ))
              : tree.map((cat) => {
                  const config = getCategoryVisualConfig(cat.name);
                  const subs = cat.subcategories || [];
                  const hasSubs = subs.length > 0;
                  const isOpen = expanded === cat._id;

                  return (
                    <div key={cat._id}>
                      <div className="flex items-center">
                        <SheetClose asChild>
                          <Link
                            href={`/m/productos?categoria=${cat.slug}`}
                            className="flex flex-1 items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
                          >
                            <span
                              className={cn(
                                'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg shadow-sm',
                                config.gradient
                              )}
                            >
                              {config.emoji}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {cleanName(cat.name)}
                            </span>
                          </Link>
                        </SheetClose>

                        {hasSubs && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded(isOpen ? null : cat._id)
                            }
                            aria-label={
                              isOpen
                                ? `Contraer ${cleanName(cat.name)}`
                                : `Expandir ${cleanName(cat.name)}`
                            }
                            aria-expanded={isOpen}
                            className="tappable grid h-11 w-11 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 transition-transform',
                                isOpen && 'rotate-90'
                              )}
                            />
                          </button>
                        )}
                      </div>

                      {hasSubs && isOpen && (
                        <div className="mb-1 ml-8 space-y-0.5 border-l border-border pl-3">
                          {subs.map((sub) => (
                            <SheetClose key={sub._id} asChild>
                              <Link
                                href={`/m/productos?categoria=${cat.slug}&subcategoria=${sub.slug}`}
                                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {cleanName(sub.name)}
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
