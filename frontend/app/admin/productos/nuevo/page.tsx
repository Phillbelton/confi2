'use client';

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { useAdminProducts } from '@/hooks/admin/useAdminProducts';
import type { CreateProductParentInput } from '@/services/admin/products';

export default function NuevoProductoPage() {
  const router = useRouter();
  const { createProduct, isCreating } = useAdminProducts();

  const handleSubmit = async (data: CreateProductParentInput) => {
    createProduct(data, {
      onSuccess: (product) => {
        // Redirect to edit page to add categories, images, and variants
        router.push(`/admin/productos/${product._id}/editar`);
      },
    });
  };

  return (
    <ProductForm
      mode="create"
      onSubmit={handleSubmit}
      isSubmitting={isCreating}
    />
  );
}
