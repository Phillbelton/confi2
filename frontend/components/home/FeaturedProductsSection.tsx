'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCarousel } from './ProductCarousel';
import type { ProductParent } from '@/types';

interface FeaturedProductsSectionProps {
  products: ProductParent[];
  isLoading?: boolean;
}

export function FeaturedProductsSection({ products, isLoading }: FeaturedProductsSectionProps) {
  return (
    <section className="py-8 sm:py-12">
      <div className="container px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Productos destacados</h2>
          <Link href="/productos?featured=true">
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[240px]">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 mt-3 w-3/4" />
                <Skeleton className="h-4 mt-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <ProductCarousel products={products} />
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No hay productos destacados en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
