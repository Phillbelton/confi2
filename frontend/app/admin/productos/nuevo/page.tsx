'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SimpleProductForm } from '@/components/admin/products/SimpleProductForm';
import { VariantProductForm } from '@/components/admin/products/VariantProductForm';
import { useToast } from '@/hooks/use-toast';
import type { VariantCombination } from '@/components/admin/products/VariantConfigurationTable';

type ProductType = 'simple' | 'variantes';

export default function NuevoProductoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tipo = searchParams.get('tipo') as ProductType | null;

  // Redirect if tipo is not specified
  useEffect(() => {
    if (!tipo || (tipo !== 'simple' && tipo !== 'variantes')) {
      router.push('/admin/productos');
    }
  }, [tipo, router]);

  const handleSimpleProductSubmit = async (data: any, images: File[]) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add product data
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('categories', JSON.stringify(data.categories));

      if (data.brand) {
        formData.append('brand', data.brand);
      }

      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }

      if (data.seoTitle) {
        formData.append('seoTitle', data.seoTitle);
      }

      if (data.seoDescription) {
        formData.append('seoDescription', data.seoDescription);
      }

      formData.append('featured', String(data.featured || false));
      formData.append('active', String(data.active !== undefined ? data.active : true));

      // Add default variant data for simple products
      const defaultVariant = {
        price: data.price,
        stock: data.stock,
        ...(data.sku && { sku: data.sku }),
      };
      formData.append('defaultVariant', JSON.stringify(defaultVariant));

      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Make API request
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/parents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el producto');
      }

      const result = await response.json();

      // Show success message
      toast({
        title: 'Producto creado',
        description: 'El producto se ha creado exitosamente',
      });

      // Show image upload warnings if any
      if (result.data.imageUploadResult?.failed?.length > 0) {
        toast({
          title: 'Advertencia',
          description: `${result.data.imageUploadResult.failed.length} imagen(es) no se pudieron subir`,
          variant: 'destructive',
        });
      }

      // Redirect to products list
      router.push('/admin/productos');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el producto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimpleProductSubmitAndCreateAnother = async (data: any, images: File[]) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add product data
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('categories', JSON.stringify(data.categories));

      if (data.brand) {
        formData.append('brand', data.brand);
      }

      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }

      if (data.seoTitle) {
        formData.append('seoTitle', data.seoTitle);
      }

      if (data.seoDescription) {
        formData.append('seoDescription', data.seoDescription);
      }

      formData.append('featured', String(data.featured || false));
      formData.append('active', String(data.active !== undefined ? data.active : true));

      // Add default variant data for simple products
      const defaultVariant = {
        price: data.price,
        stock: data.stock,
        ...(data.sku && { sku: data.sku }),
      };
      formData.append('defaultVariant', JSON.stringify(defaultVariant));

      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Make API request
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/parents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el producto');
      }

      const result = await response.json();

      // Show success message
      toast({
        title: 'Producto creado',
        description: 'Listo para crear otro producto',
      });

      // Show image upload warnings if any
      if (result.data.imageUploadResult?.failed?.length > 0) {
        toast({
          title: 'Advertencia',
          description: `${result.data.imageUploadResult.failed.length} imagen(es) no se pudieron subir`,
          variant: 'destructive',
        });
      }

      // Don't redirect - form will be reset by SimpleProductForm
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el producto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVariantProductSubmit = async (
    data: any,
    parentImages: File[],
    variantAttributes: any[],
    variantCombinations: VariantCombination[]
  ) => {
    setIsSubmitting(true);

    try {
      // Step 1: Create parent product
      const parentFormData = new FormData();
      parentFormData.append('name', data.name);
      parentFormData.append('description', data.description);
      parentFormData.append('categories', JSON.stringify(data.categories));

      if (data.brand) {
        parentFormData.append('brand', data.brand);
      }

      if (data.tags && data.tags.length > 0) {
        parentFormData.append('tags', JSON.stringify(data.tags));
      }

      if (data.seoTitle) {
        parentFormData.append('seoTitle', data.seoTitle);
      }

      if (data.seoDescription) {
        parentFormData.append('seoDescription', data.seoDescription);
      }

      parentFormData.append('featured', String(data.featured || false));
      parentFormData.append('active', String(data.active !== undefined ? data.active : true));

      // Add variant attributes
      parentFormData.append('variantAttributes', JSON.stringify(variantAttributes));

      // Add parent images
      parentImages.forEach((image) => {
        parentFormData.append('images', image);
      });

      // Create parent
      const token = localStorage.getItem('admin-token');
      const parentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/parents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: parentFormData,
      });

      if (!parentResponse.ok) {
        const errorData = await parentResponse.json();
        throw new Error(errorData.message || 'Error al crear el producto padre');
      }

      const parentResult = await parentResponse.json();
      const parentId = parentResult.data.productParent._id;

      // Step 2: Create variants in batch
      const variantsPayload = variantCombinations.map((combo) => ({
        attributes: combo.attributes,
        price: combo.price,
        stock: combo.stock,
        ...(combo.sku && { sku: combo.sku }),
      }));

      const variantsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/parents/${parentId}/variants/batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ variants: variantsPayload }),
        }
      );

      if (!variantsResponse.ok) {
        const errorData = await variantsResponse.json();
        throw new Error(errorData.message || 'Error al crear las variantes');
      }

      const variantsResult = await variantsResponse.json();

      // Show success message
      toast({
        title: 'Producto creado',
        description: `Producto con ${variantsResult.data.created.length} variante(s) creado exitosamente`,
      });

      // Show warnings for failed variants if any
      if (variantsResult.data.failed && variantsResult.data.failed.length > 0) {
        toast({
          title: 'Advertencia',
          description: `${variantsResult.data.failed.length} variante(s) no se pudieron crear`,
          variant: 'destructive',
        });
      }

      // Redirect to products list
      router.push('/admin/productos');
    } catch (error: any) {
      console.error('Error creating variant product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el producto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVariantProductSubmitAndCreateAnother = async (
    data: any,
    parentImages: File[],
    variantAttributes: any[],
    variantCombinations: VariantCombination[]
  ) => {
    setIsSubmitting(true);

    try {
      // Step 1: Create parent product
      const parentFormData = new FormData();
      parentFormData.append('name', data.name);
      parentFormData.append('description', data.description);
      parentFormData.append('categories', JSON.stringify(data.categories));

      if (data.brand) {
        parentFormData.append('brand', data.brand);
      }

      if (data.tags && data.tags.length > 0) {
        parentFormData.append('tags', JSON.stringify(data.tags));
      }

      if (data.seoTitle) {
        parentFormData.append('seoTitle', data.seoTitle);
      }

      if (data.seoDescription) {
        parentFormData.append('seoDescription', data.seoDescription);
      }

      parentFormData.append('featured', String(data.featured || false));
      parentFormData.append('active', String(data.active !== undefined ? data.active : true));

      // Add variant attributes
      parentFormData.append('variantAttributes', JSON.stringify(variantAttributes));

      // Add parent images
      parentImages.forEach((image) => {
        parentFormData.append('images', image);
      });

      // Create parent
      const token = localStorage.getItem('admin-token');
      const parentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/parents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: parentFormData,
      });

      if (!parentResponse.ok) {
        const errorData = await parentResponse.json();
        throw new Error(errorData.message || 'Error al crear el producto padre');
      }

      const parentResult = await parentResponse.json();
      const parentId = parentResult.data.productParent._id;

      // Step 2: Create variants in batch
      const variantsPayload = variantCombinations.map((combo) => ({
        attributes: combo.attributes,
        price: combo.price,
        stock: combo.stock,
        ...(combo.sku && { sku: combo.sku }),
      }));

      const variantsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/parents/${parentId}/variants/batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ variants: variantsPayload }),
        }
      );

      if (!variantsResponse.ok) {
        const errorData = await variantsResponse.json();
        throw new Error(errorData.message || 'Error al crear las variantes');
      }

      const variantsResult = await variantsResponse.json();

      // Show success message
      toast({
        title: 'Producto creado',
        description: `Listo para crear otro producto. ${variantsResult.data.created.length} variante(s) creadas`,
      });

      // Show warnings for failed variants if any
      if (variantsResult.data.failed && variantsResult.data.failed.length > 0) {
        toast({
          title: 'Advertencia',
          description: `${variantsResult.data.failed.length} variante(s) no se pudieron crear`,
          variant: 'destructive',
        });
      }

      // Don't redirect - form will be reset by VariantProductForm
    } catch (error: any) {
      console.error('Error creating variant product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el producto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if tipo is invalid (will redirect)
  if (!tipo || (tipo !== 'simple' && tipo !== 'variantes')) {
    return null;
  }

  return (
    <>
      {tipo === 'simple' && (
        <SimpleProductForm
          onSubmit={handleSimpleProductSubmit}
          onSubmitAndCreateAnother={handleSimpleProductSubmitAndCreateAnother}
          isSubmitting={isSubmitting}
        />
      )}

      {tipo === 'variantes' && (
        <VariantProductForm
          onSubmit={handleVariantProductSubmit}
          onSubmitAndCreateAnother={handleVariantProductSubmitAndCreateAnother}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
