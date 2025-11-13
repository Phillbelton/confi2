'use client';

import { useProductVariants } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import type { ProductParent } from '@/types';

interface ProductCardWithVariantsProps {
  product: ProductParent;
  className?: string;
}

export function ProductCardWithVariants({ product, className }: ProductCardWithVariantsProps) {
  // Solo cargar variantes si el producto las tiene
  const { data: variantsData } = useProductVariants(
    product.hasVariants ? product._id : ''
  );

  const variants = variantsData?.data || [];

  return <ProductCard product={product} variants={variants} className={className} />;
}
