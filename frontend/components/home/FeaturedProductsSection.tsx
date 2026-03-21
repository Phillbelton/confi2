'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton-card';
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
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold">Productos destacados</h2>
          <Link href="/productos?featured=true">
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Products */}
        {isLoading ? (
          <SkeletonList count={5} />
        ) : products.length > 0 ? (
          <ProductCarousel products={products} />
        ) : (
          <motion.p
            className="text-muted-foreground text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No hay productos destacados en este momento.
          </motion.p>
        )}
      </div>
    </section>
  );
}
