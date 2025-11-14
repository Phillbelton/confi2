'use client';

import { useProductVariants } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import type { ProductParent } from '@/types';

interface ProductCardWithVariantsProps {
  product: ProductParent;
  className?: string;
}

export function ProductCardWithVariants({ product, className }: ProductCardWithVariantsProps) {
  // Siempre cargar variantes (todos los productos deben tener al menos 1)
  // hasVariants solo controla si se muestra el selector, no si se cargan
  const { data: variantsData } = useProductVariants(product._id);

  const variants = variantsData?.data || [];

  return <ProductCard product={product} variants={variants} className={className} />;
}
