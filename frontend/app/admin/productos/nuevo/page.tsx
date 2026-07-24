'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductForm, type ProductSubmit } from '@/components/admin/products/ProductForm';
import { useProductOperations } from '@/hooks/admin/useAdminProducts';
import { assignCollections } from '@/lib/admin/productCollections';
import type { Product } from '@/types';

export default function NuevoProductoPage() {
  const router = useRouter();
  const { create, isCreating, uploadImages } = useProductOperations();

  const handleSubmit = async ({ payload, images, collectionIds }: ProductSubmit) => {
    create(payload, {
      onSuccess: async (result: { product: Product }) => {
        const id = result.product?._id;

        if (id && collectionIds.length > 0) {
          const ok = await assignCollections(id, collectionIds);
          if (!ok) toast.warning('El producto se creó, pero falló asignar alguna colección.');
        }

        if (id && images.length > 0) {
          uploadImages(
            { id, files: images },
            {
              onSuccess: () => router.push('/admin/productos'),
              // El producto ya existe pero quedó sin fotos: en vez de volver a la
              // lista (donde el fallo pasa desapercibido) vamos a su edición
              // para que el admin reintente la subida desde ahí.
              onError: () => {
                toast.warning(
                  'El producto se creó, pero falló la subida de imágenes. Reintenta desde acá.'
                );
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
