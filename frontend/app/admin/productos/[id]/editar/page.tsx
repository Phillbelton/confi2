'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ProductForm,
  type ProductSubmit,
  type ProductDefaults,
} from '@/components/admin/products/ProductForm';
import { newPresentation } from '@/components/admin/products/PresentationsEditor';
import { useAdminProduct, useProductOperations } from '@/hooks/admin/useAdminProducts';
import {
  assignCollections,
  getCollectionIdsForProduct,
} from '@/lib/admin/productCollections';
import { EmptyState } from '@/components/admin/kit';
import type { Product, Category, Brand, Format, Flavor } from '@/types';

// El backend devuelve las refs como id string o ya populadas.
type RefOrPopulated = string | { _id: string } | null | undefined;
const idOf = (v: RefOrPopulated): string | undefined =>
  !v ? undefined : typeof v === 'string' ? v : v._id;

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useAdminProduct(id);
  const { update, isUpdating, uploadImages, deleteImage } = useProductOperations();
  const product = data?.product as Product | undefined;

  // A qué colecciones pertenece hoy: se necesita para precargar los chips y
  // para saber de cuáles hay que sacarlo si el admin las deselecciona.
  const { data: collectionIds = [], isLoading: isLoadingCollections } = useQuery({
    queryKey: ['admin-collections', 'of-product', id],
    queryFn: () => getCollectionIdsForProduct(id),
    enabled: !!product,
    staleTime: 60_000,
  });

  const defaults = useMemo<ProductDefaults | undefined>(() => {
    if (!product) return undefined;

    const presentaciones = (product.presentaciones ?? []).map((p) =>
      newPresentation({
        type: p.type,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        tiers: p.tiers ?? [],
        fixedDiscount: p.fixedDiscount,
        label: p.label,
        barcode: p.barcode,
        principal: !!p.principal,
      })
    );

    // Productos viejos sin migrar: se arma la principal desde los campos legacy
    // para que el editor nunca abra vacío.
    if (presentaciones.length === 0) {
      presentaciones.push(
        newPresentation({
          type: product.saleUnit?.type ?? 'unidad',
          quantity: product.saleUnit?.quantity ?? 1,
          unitPrice: product.unitPrice,
          tiers: product.tiers ?? [],
          fixedDiscount: product.fixedDiscount,
          principal: true,
        })
      );
    } else if (!presentaciones.some((p) => p.principal)) {
      presentaciones[0].principal = true;
    }

    return {
      sku: product.sku,
      name: product.name,
      description: product.description,
      categories: (product.categories as Array<string | Category>)
        .map((c) => idOf(c))
        .filter((x): x is string => Boolean(x)),
      brand: idOf(product.brand as RefOrPopulated | Brand),
      format: idOf(product.format as RefOrPopulated | Format),
      flavors: (product.flavors || [])
        .map((f) => idOf(f as RefOrPopulated | Flavor))
        .filter((x): x is string => Boolean(x)),
      barcode: product.barcode,
      featured: product.featured,
      active: product.active,
      // Sin esto el form arranca con attributes {} y el submit los borraría.
      attributes: product.attributes || {},
      presentaciones,
      images: product.images || [],
      collectionIds,
    };
  }, [product, collectionIds]);

  if (isLoading || (product && isLoadingCollections)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product || !defaults) {
    return (
      <EmptyState
        title="No encontramos este producto"
        description="Puede que lo hayan eliminado o que el enlace esté mal."
        action={
          <button
            type="button"
            onClick={() => router.push('/admin/productos')}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Volver a Productos
          </button>
        }
      />
    );
  }

  const handleSubmit = async ({ payload, images, collectionIds: nextIds }: ProductSubmit) => {
    update(
      { id, data: payload },
      {
        onSuccess: async () => {
          const ok = await assignCollections(id, nextIds, collectionIds);
          if (!ok) toast.warning('Se guardó el producto, pero falló actualizar alguna colección.');

          if (images.length > 0) {
            // Si el upload falla nos quedamos acá: las imágenes siguen
            // seleccionadas y el admin puede reintentar guardando de nuevo.
            uploadImages(
              { id, files: images },
              { onSuccess: () => router.push('/admin/productos') }
            );
          } else {
            router.push('/admin/productos');
          }
        },
      }
    );
  };

  return (
    <ProductForm
      mode="edit"
      defaults={defaults}
      onSubmit={handleSubmit}
      isSubmitting={isUpdating}
      onDeleteImage={(filename) => deleteImage({ id, filename })}
    />
  );
}
