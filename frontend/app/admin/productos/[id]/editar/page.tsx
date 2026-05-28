'use client';

import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProductForm, type ProductFormValues } from '@/components/admin/products/ProductForm';
import { useAdminProduct, useProductOperations } from '@/hooks/admin/useAdminProducts';
import type { Product, Category, Brand, Format, Flavor } from '@/types';

// Backend devuelve refs como string (id) o como objeto populado.
// Helper genérico para resolver siempre al _id string.
type RefOrPopulated = string | { _id: string } | null | undefined;
const idOf = (v: RefOrPopulated): string | undefined =>
  !v ? undefined : typeof v === 'string' ? v : v._id;

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

  const categoryIds: string[] = (product.categories as Array<string | Category>)
    .map((c) => idOf(c))
    .filter((x): x is string => Boolean(x));

  const defaultValues: Partial<ProductFormValues> = {
    sku: product.sku,
    name: product.name,
    description: product.description,
    categories: categoryIds,
    brand: idOf(product.brand as RefOrPopulated | Brand),
    format: idOf(product.format as RefOrPopulated | Format),
    flavor: idOf(product.flavor as RefOrPopulated | Flavor),
    barcode: product.barcode,
    unitPrice: product.unitPrice,
    saleUnit: product.saleUnit,
    tiers: product.tiers || [],
    featured: product.featured,
    active: product.active,
  };

  const handleSubmit = async (values: ProductFormValues, images: File[]) => {
    update(
      { id, data: values },
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
