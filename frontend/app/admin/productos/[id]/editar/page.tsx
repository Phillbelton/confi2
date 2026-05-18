'use client';

import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProductForm, type ProductFormValues } from '@/components/admin/products/ProductForm';
import { useAdminProduct, useProductOperations } from '@/hooks/admin/useAdminProducts';
import type { Product, Brand, Category, Format, Flavor } from '@/types';

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useAdminProduct(id);
  const { update, isUpdating, uploadImages } = useProductOperations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Producto no encontrado</p>
      </div>
    );
  }

  const product = data.product as Product;

  const idOf = (v: any): string | undefined =>
    !v ? undefined : typeof v === 'string' ? v : v._id;

  const defaultValues: Partial<ProductFormValues> = {
    name: product.name,
    description: product.description,
    categories: (product.categories as any[])
      .map((c) => idOf(c))
      .filter((x): x is string => Boolean(x)),
    brand: idOf(product.brand),
    format: idOf(product.format),
    flavor: idOf(product.flavor),
    barcode: product.barcode,
    provider: product.provider,
    unitPrice: product.unitPrice,
    saleUnit: product.saleUnit,
    tiers: product.tiers || [],
    featured: product.featured,
    active: product.active,
  };

  const handleSubmit = async (values: ProductFormValues, images: File[]) => {
    update(
      { id, data: values as any },
      {
        onSuccess: () => {
          if (images.length > 0) {
            uploadImages({ id, files: images }, {
              onSettled: () => router.push('/admin/productos'),
            });
          } else {
            router.push('/admin/productos');
          }
        },
      }
    );
  };

  return (
    <ProductForm
      onSubmit={handleSubmit}
      isSubmitting={isUpdating}
      isEditing
      defaultValues={defaultValues}
      defaultImages={product.images || []}
    />
  );
}
