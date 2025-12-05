'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProductParent } from '@/types';
import { ProductCardPremium } from './ProductCardPremium';

interface ProductGridPremiumProps {
  products: ProductParent[];
  viewMode?: 'grid' | 'list';
  onQuickView?: (product: ProductParent) => void;
  loading?: boolean;
}

export function ProductGridPremium({
  products,
  viewMode = 'grid',
  onQuickView,
  loading = false,
}: ProductGridPremiumProps) {
  const [parentRef] = useAutoAnimate({
    duration: 300,
    easing: 'ease-out',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        ref={parentRef}
        className={cn(
          'grid gap-4 sm:gap-6',
          viewMode === 'grid'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-1'
        )}
      >
        {products.map((product, index) => (
          <ProductCardPremium
            key={product._id}
            product={product}
            variants={(product as any).variants || []}
            onQuickView={() => onQuickView?.(product)}
            index={index}
            priority={index < 5}
          />
        ))}
      </div>
    </motion.div>
  );
}
