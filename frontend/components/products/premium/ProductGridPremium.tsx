'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProductParent } from '@/types';
import { ProductCardPremium } from './ProductCardPremium';

interface ProductGridPremiumProps {
  products: ProductParent[];
  onQuickView?: (product: ProductParent) => void;
  loading?: boolean;
}

export function ProductGridPremium({
  products,
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
        className="grid gap-2 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
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
