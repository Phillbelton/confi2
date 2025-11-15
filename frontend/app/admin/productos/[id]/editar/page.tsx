'use client';

import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { ImageUploader } from '@/components/admin/products/ImageUploader';
import { VariantsTable } from '@/components/admin/products/VariantsTable';
import {
  useAdminProduct,
  useAdminProducts,
  useAdminProductVariants,
} from '@/hooks/admin/useAdminProducts';
import { Card, CardContent } from '@/components/ui/card';
import type { UpdateProductParentInput } from '@/services/admin/products';

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { product, isLoading, error } = useAdminProduct(productId);
  const {
    updateProduct,
    isUpdating,
    uploadImages,
    isUploadingImages,
    deleteImage,
    isDeletingImage,
  } = useAdminProducts();
  const {
    variants,
    isLoading: isLoadingVariants,
    updateVariant,
    deleteVariant,
    updateStock,
  } = useAdminProductVariants(productId);

  const handleSubmit = async (data: UpdateProductParentInput) => {
    updateProduct(
      { id: productId, data },
      {
        onSuccess: () => {
          // Stay on edit page to continue managing images/variants
        },
      }
    );
  };

  const handleUploadImages = async (files: File[]) => {
    uploadImages({ id: productId, files });
  };

  const handleDeleteImage = async (filename: string) => {
    deleteImage({ id: productId, filename });
  };

  const handleUpdateVariant = (variantId: string, data: { price?: number; stock?: number }) => {
    if (data.stock !== undefined) {
      updateStock({ id: variantId, data: { stock: data.stock } });
    }
    if (data.price !== undefined) {
      updateVariant({ id: variantId, data: { price: data.price } });
    }
  };

  const handleDeleteVariant = (variantId: string) => {
    if (confirm('¿Estás seguro de eliminar esta variante?')) {
      deleteVariant(variantId);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Producto</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="images">Imágenes</TabsTrigger>
          <TabsTrigger value="variants">
            Variantes {variants.length > 0 && `(${variants.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <ProductForm
            product={product}
            mode="edit"
            onSubmit={handleSubmit}
            isSubmitting={isUpdating}
          />
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <ImageUploader
            images={product.images || []}
            onUpload={handleUploadImages}
            onDelete={handleDeleteImage}
            isUploading={isUploadingImages}
            isDeleting={isDeletingImage}
            maxImages={5}
          />
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants">
          <VariantsTable
            variants={variants}
            onUpdateVariant={handleUpdateVariant}
            onDeleteVariant={handleDeleteVariant}
            isLoading={isLoadingVariants}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
