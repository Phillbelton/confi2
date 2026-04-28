'use client';

import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { categoryVisualMap } from '@/lib/categoryVisualConfig';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryChipsProps {
  activeSlug?: string;
  className?: string;
  /** Cuando es true se renderiza sticky bajo el header */
  sticky?: boolean;
}

export function CategoryChips({ activeSlug, className, sticky = false }: CategoryChipsProps) {
  const { data: categories, isLoading } = useCategories();

  const mainCategories: Category[] = (categories || []).filter(
    (c: Category) => !c.parent
  );

  const list: { slug?: string; name: string; emoji: string; gradient: string }[] = [
    { name: 'Todo', emoji: '✨', gradient: 'from-primary to-secondary' },
    ...mainCategories.map((c) => {
      const visual = categoryVisualMap[c.name] || {
        emoji: c.icon || '🍭',
        gradient: 'from-primary to-secondary',
      };
      return {
        slug: c.slug,
        name: c.name.replace(/^Categoria-\d+-/, ''),
        emoji: visual.emoji,
        gradient: visual.gradient,
      };
    }),
  ];

  return (
    <div
      className={cn(
        'border-b border-border/60 bg-background',
        sticky && 'sticky top-[var(--m-header-h,9.5rem)] z-20',
        className
      )}
    >
      <div className="snap-x-mandatory flex gap-2 overflow-x-auto px-4 py-3 scroll-pl-safe scroll-pr-safe scrollbar-none">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 w-20 shrink-0 animate-pulse rounded-2xl bg-muted" />
            ))
          : list.map((cat) => {
              const isActive = cat.slug
                ? activeSlug === cat.slug
                : !activeSlug && cat.name === 'Todo';
              const href = cat.slug ? `/m/productos?categoria=${cat.slug}` : '/m/productos';

              return (
                <Link
                  key={cat.name}
                  href={href}
                  className={cn(
                    'snap-start tappable flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2 text-[11px] font-medium transition-all',
                    isActive
                      ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10'
                      : 'border-transparent text-foreground hover:border-border'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br text-xl shadow-sm',
                      cat.gradient
                    )}
                  >
                    <span aria-hidden>{cat.emoji}</span>
                  </span>
                  <span className="line-clamp-1 text-center leading-tight">{cat.name}</span>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
