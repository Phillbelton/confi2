'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductFormV2, type ProductV2Submit } from '@/components/admin/products/v2/ProductFormV2';
import { useProductOperations } from '@/hooks/admin/useAdminProducts';
import { adminCollectionService } from '@/services/admin/collections';
import type { Product } from '@/types';

/**
 * Página PROVISORIA del formulario de producto rediseñado (v2 / "ideal").
 * Convive con `/admin/productos/nuevo` (form actual) sin reemplazarlo, para
 * poder contrastar ambos antes de decidir el cambio definitivo.
 */

/** Agrega el producto a cada colección seleccionada (best-effort, no bloquea). */
async function assignCollections(productId: string, collectionIds: string[]): Promise<boolean> {
  let allOk = true;
  for (const cid of collectionIds) {
    try {
      const res = await adminCollectionService.getById(cid);
      const products = res.data.collection.products || [];
      const ids = products.map((p) => (typeof p === 'string' ? p : p._id));
      if (!ids.includes(productId)) {
        await adminCollectionService.update(cid, { products: [...ids, productId] });
      }
    } catch {
      allOk = false;
    }
  }
  return allOk;
}

export default function NuevoProductoV2Page() {
  const router = useRouter();
  const { create, isCreating, uploadImages } = useProductOperations();

  const handleSubmit = async ({ payload, images, collectionIds }: ProductV2Submit) => {
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
              onError: () => {
                toast.warning('El producto se creó, pero falló la subida de imágenes. Reintenta desde la edición.');
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

  return <ProductFormV2 onSubmit={handleSubmit} isSubmitting={isCreating} />;
}
