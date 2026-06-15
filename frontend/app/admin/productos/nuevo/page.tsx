'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductForm, type ProductFormValues } from '@/components/admin/products/ProductForm';
import { useProductOperations } from '@/hooks/admin/useAdminProducts';
import type { CreateProductInput } from '@/services/admin/products';
import type { Product } from '@/types';

export default function NuevoProductoPage() {
  const router = useRouter();
  const { create, isCreating, uploadImages } = useProductOperations();

  const handleSubmit = async (data: ProductFormValues, images: File[]) => {
    const payload: CreateProductInput = {
      sku: data.sku?.trim() || undefined,
      name: data.name,
      description: data.description,
      categories: data.categories,
      brand: data.brand,
      format: data.format,
      flavor: data.flavor,
      barcode: data.barcode,
      unitPrice: data.unitPrice,
      saleUnit: data.saleUnit,
      tiers: data.tiers,
      featured: data.featured,
      active: data.active,
      attributes: data.attributes,
    };
    create(payload, {
      onSuccess: (result: { product: Product }) => {
        const id = result.product?._id;
        if (id && images.length > 0) {
          uploadImages(
            { id, files: images },
            {
              onSuccess: () => router.push('/admin/productos'),
              // El producto ya existe pero quedó sin fotos: en vez de volver a la
              // lista (donde el fallo pasa desapercibido) vamos a su edición
              // para que el admin reintente la subida desde ahí.
              onError: () => {
                toast.warning('El producto se creó, pero falló la subida de imágenes. Reintentá desde acá.');
                router.push(`/admin/productos/${id}/editar`);
              },
            }
          );
        } else {
          router.push('/admin/productos');
        }
      },
    });
  };

  return <ProductForm onSubmit={handleSubmit} isSubmitting={isCreating} />;
}
