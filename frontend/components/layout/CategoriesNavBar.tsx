'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgePercent, ChevronRight, Grid3x3, Package, Sparkles } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useCategoriesFlat } from '@/hooks/useCategories';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { buildSrcSet } from '@/lib/imageSrcset';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

type RootWithChildren = Category & {
  l2: Array<Category & { children: Category[] }>;
};

/** Estilo compartido de los triggers/links de la fila de navegación:
 *  texto petróleo, bloque resaltado al hover/abrir y subrayado candy animado.
 *  Sobreescribe TODOS los estados de color del cva de shadcn (hover/focus/
 *  open × text/bg): cualquier combinación no cubierta filtra el text-blanco
 *  de `text-accent-foreground` y se pierde el contraste. */
const navItemClass = cn(
  'relative inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-transparent px-3',
  'text-[13px] font-semibold text-secondary transition-colors cursor-pointer',
  'hover:bg-primary/5 hover:text-primary',
  'focus:bg-transparent focus:text-primary focus-visible:outline-none',
  // Bloque resaltado mientras el panel está abierto
  'data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
  'data-[state=open]:hover:bg-primary/10 data-[state=open]:focus:bg-primary/10',
  // Subrayado animado (crece desde el centro)
  'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full',
  'after:bg-gradient-to-r after:from-primary after:to-accent',
  'after:origin-center after:scale-x-0 after:transition-transform after:duration-200',
  'hover:after:scale-x-100 data-[state=open]:after:scale-x-100'
);

/**
 * Fila de navegación secundaria del header (solo desktop), estilo Jumbo/Líder:
 * las categorías raíz expuestas como triggers con mega-panel al HOVER
 * (Radix NavigationMenu maneja hover-intent), más accesos rápidos.
 *
 * Cada panel muestra las subcategorías (L2 con vista previa de L3) y una
 * columna visual con la imagen de la categoría (o gradiente + emoji).
 */
export function CategoriesNavBar() {
  const { data: allCategories, isLoading } = useCategoriesFlat();

  // Jerarquía L1 → L2 → L3, "Otros" siempre al final.
  const tree: RootWithChildren[] = useMemo(() => {
    const cats: Category[] = (allCategories as Category[]) || [];
    const parentIdOf = (c: Category) =>
      typeof c.parent === 'string' ? c.parent : c.parent?._id;
    const isOtros = (c: Category) => c.name.trim().toLowerCase() === 'otros';
    const roots = cats
      .filter((c) => !c.parent && c.active)
      .sort((a, b) => Number(isOtros(a)) - Number(isOtros(b)));
    return roots.map((root) => {
      const l2 = cats.filter((c) => c.active && parentIdOf(c) === root._id);
      return {
        ...root,
        l2: l2.map((sub) => ({
          ...sub,
          children: cats.filter((c) => c.active && parentIdOf(c) === sub._id),
        })),
      };
    });
  }, [allCategories]);

  if (isLoading) {
    return (
      <div className="flex h-11 items-center gap-4 px-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 w-20 animate-pulse rounded-full bg-secondary/15" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center">
      <NavigationMenu className="max-w-none justify-start">
        <NavigationMenuList className="justify-start gap-0">
          {/* Todas las categorías */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className={cn(navItemClass, 'pl-0')}>
              <Grid3x3 className="h-4 w-4" />
              Categorías
            </NavigationMenuTrigger>
            <NavigationMenuContent className="p-4 md:w-[560px]">
              <div className="grid grid-cols-2 gap-1.5">
                <NavigationMenuLink asChild>
                  <Link
                    href="/productos"
                    className="col-span-2 flex flex-row items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 hover:bg-primary/10"
                  >
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      Ver todos los productos
                    </span>
                  </Link>
                </NavigationMenuLink>
                {tree.map((root) => {
                  const cfg = getCategoryVisualConfig(root.name);
                  return (
                    <NavigationMenuLink key={root._id} asChild>
                      <Link
                        href={`/productos?categoria=${root.slug}`}
                        className="flex flex-row items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-muted"
                      >
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-lg shadow-sm',
                            cfg.gradient
                          )}
                        >
                          {cfg.emoji}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {root.name}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {cfg.description}
                          </span>
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  );
                })}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Una entrada por categoría raíz */}
          {tree.map((root) => (
            <RootMenuItem key={root._id} root={root} />
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Accesos rápidos a la derecha */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Link
          href="/productos?sort=newest"
          className={cn(navItemClass, 'text-secondary/90')}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Novedades
        </Link>
        <Link
          href="/productos?onSale=true"
          className={cn(navItemClass, 'pr-0 text-accent hover:text-accent after:from-accent after:to-accent')}
        >
          <BadgePercent className="h-4 w-4" />
          Ofertas
        </Link>
      </div>
    </div>
  );
}

/** Trigger + mega-panel de una categoría raíz. */
function RootMenuItem({ root }: { root: RootWithChildren }) {
  const router = useRouter();
  const cfg = getCategoryVisualConfig(root.name);
  // [400, 800]: intersección de anchos que existen tanto para thumbs nuevos
  // (master → 200/400/800) como para imágenes de categoría legacy (400/800).
  const thumb = root.image ? buildSrcSet(root.image, [400, 800]) : null;
  const href = `/productos?categoria=${root.slug}`;

  // Sin subcategorías → link directo, sin panel.
  if (root.l2.length === 0) {
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link href={href} className={navItemClass}>
            {root.name}
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      {/* Hover abre el panel (Radix); el CLICK navega al catálogo completo de
          la raíz. preventDefault frena el toggle interno de Radix (respeta
          defaultPrevented), así el click no abre/cierra el panel. */}
      <NavigationMenuTrigger
        className={navItemClass}
        onClick={(e) => {
          e.preventDefault();
          router.push(href);
        }}
      >
        {root.name}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="p-0 md:w-[680px]">
        <div className="flex">
          {/* Subcategorías L2 (+ preview L3) */}
          <div className="grid flex-1 grid-cols-2 content-start gap-0.5 p-4">
            {root.l2.map((sub) => (
              <NavigationMenuLink key={sub._id} asChild>
                <Link
                  href={`/productos?categoria=${sub.slug}`}
                  className="group/sub rounded-lg px-3 py-2 hover:bg-muted"
                >
                  <span className="block text-sm font-semibold text-foreground group-hover/sub:text-primary">
                    {sub.name}
                  </span>
                  {sub.children.length > 0 && (
                    <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
                      {sub.children.slice(0, 3).map((c) => c.name).join(' · ')}
                      {sub.children.length > 3 && ` +${sub.children.length - 3}`}
                    </span>
                  )}
                </Link>
              </NavigationMenuLink>
            ))}
          </div>

          {/* Columna visual: imagen de la categoría o gradiente + emoji */}
          <div className="w-52 shrink-0 p-3 pl-0">
            <NavigationMenuLink asChild>
              <Link
                href={href}
                className={cn(
                  'group/visual relative flex h-full min-h-[190px] flex-col justify-end overflow-hidden rounded-xl p-3',
                  'bg-gradient-to-br',
                  cfg.gradient
                )}
              >
                {thumb && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={thumb.src}
                    srcSet={thumb.srcSet}
                    sizes="208px"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/visual:scale-105"
                  />
                )}
                {!thumb && (
                  <span
                    className="pointer-events-none absolute right-1 top-3 text-6xl opacity-70"
                    aria-hidden
                  >
                    {cfg.emoji}
                  </span>
                )}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                  aria-hidden
                />
                <span className="relative z-10 text-sm font-bold text-white drop-shadow">
                  {root.name}
                </span>
                <span className="relative z-10 mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-white/90">
                  Ver todo
                  <ChevronRight className="h-3 w-3 transition-transform group-hover/visual:translate-x-0.5" />
                </span>
              </Link>
            </NavigationMenuLink>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
