'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const hasImage = category.image && category.image.length > 0;

  return (
    <Link
      href={`/productos?categories=${category._id}`}
      className={cn(
        'group relative flex flex-col items-center justify-center',
        'min-w-[100px] w-[100px] sm:w-[120px] lg:w-[140px]',
        'transition-transform duration-200 hover:scale-105',
        className
      )}
    >
      {/* Image Container */}
      <div
        className={cn(
          'relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden',
          'bg-gradient-to-br from-primary/10 to-primary/5',
          'border-2 border-primary/20 group-hover:border-primary/40',
          'transition-all duration-200 shadow-sm group-hover:shadow-md'
        )}
        style={category.color ? { borderColor: category.color } : undefined}
      >
        {hasImage ? (
          <Image
            src={category.image!}
            alt={category.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {category.icon || '🍬'}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="mt-2 text-xs sm:text-sm font-medium text-center line-clamp-2 text-foreground/80 group-hover:text-foreground transition-colors">
        {category.name}
      </span>
    </Link>
  );
}
