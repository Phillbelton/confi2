'use client';

import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { useAdminProduct, useAdminProducts } from '@/hooks/admin/useAdminProducts';
import { Card, CardContent } from '@/components/ui/card';
import type { UpdateProductParentInput } from '@/services/admin/products';

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { product, isLoading, error } = useAdminProduct(productId);
  const { updateProduct, isUpdating } = useAdminProducts();

  const handleSubmit = async (data: UpdateProductParentInput) => {
    updateProduct(
      { id: productId, data },
      {
        onSuccess: () => {
          router.push('/admin/productos');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !product) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium mb-2">Producto no encontrado</p>
          <p className="text-sm text-muted-foreground">
            El producto que buscas no existe o fue eliminado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ProductForm
      product={product}
      mode="edit"
      onSubmit={handleSubmit}
      isSubmitting={isUpdating}
    />
  );
}
