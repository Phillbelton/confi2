'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CategorySelector } from './CategorySelector';
import { BrandSelector } from './BrandSelector';
import { VariantAttributesManager } from './VariantAttributesManager';
import type { ProductParent, VariantAttribute } from '@/types';
import type { CreateProductParentInput } from '@/services/admin/products';

const productFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  categories: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(70, 'El título SEO no puede exceder 70 caracteres').optional(),
  seoDescription: z.string().max(160, 'La descripción SEO no puede exceder 160 caracteres').optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  variantAttributes: z.array(z.any()).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: ProductParent;
  onSubmit: (data: CreateProductParentInput) => void | Promise<void>;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

export function ProductForm({ product, onSubmit, isSubmitting, mode }: ProductFormProps) {
  const router = useRouter();
  const [tagsInput, setTagsInput] = useState('');
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>(
    product?.variantAttributes || []
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      categories: product?.categories?.map(c => typeof c === 'string' ? c : c._id) || [],
      brand: product?.brand ? (typeof product.brand === 'string' ? product.brand : product.brand._id) : '',
      tags: product?.tags || [],
      seoTitle: product?.seoTitle || '',
      seoDescription: product?.seoDescription || '',
      featured: product?.featured || false,
      active: product?.active ?? true,
      variantAttributes: product?.variantAttributes || [],
    },
  });

  // Update tags input when product changes
  useEffect(() => {
    if (product?.tags) {
      setTagsInput(product.tags.join(', '));
    }
  }, [product]);

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    // Convert comma-separated string to array
    const tagsArray = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    form.setValue('tags', tagsArray);
  };

  const handleFormSubmit = (values: ProductFormValues) => {
    onSubmit({
      ...values,
      featured: values.featured ?? false,
      active: values.active ?? true,
      variantAttributes,
    } as CreateProductParentInput);
  };

  const handleVariantAttributesChange = (attributes: VariantAttribute[]) => {
    setVariantAttributes(attributes);
    form.setValue('variantAttributes', attributes);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create'
                ? 'Crea un nuevo producto con sus atributos y variantes'
                : 'Modifica la información del producto'}
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
            </>
          )}
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Ej: Alfajores de Chocolate"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe el producto en detalle..."
                rows={5}
                disabled={isSubmitting}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Categories */}
            <CategorySelector
              selectedIds={form.watch('categories') || []}
              onChange={(ids) => form.setValue('categories', ids)}
              disabled={isSubmitting}
            />
            {form.formState.errors.categories && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.categories.message}
              </p>
            )}

            {/* Brand */}
            <BrandSelector
              selectedId={form.watch('brand')}
              onChange={(id) => form.setValue('brand', id)}
              disabled={isSubmitting}
            />

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="Sin azúcar, Vegano, Artesanal (separadas por comas)"
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Separa las etiquetas con comas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variant Attributes */}
        <VariantAttributesManager
          attributes={variantAttributes}
          onChange={handleVariantAttributesChange}
          disabled={isSubmitting}
        />

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SEO Title */}
            <div>
              <Label htmlFor="seoTitle">Título SEO</Label>
              <Input
                id="seoTitle"
                {...form.register('seoTitle')}
                placeholder="Título optimizado para motores de búsqueda"
                maxLength={70}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Máximo 70 caracteres • {form.watch('seoTitle')?.length || 0}/70
              </p>
            </div>

            {/* SEO Description */}
            <div>
              <Label htmlFor="seoDescription">Descripción SEO</Label>
              <Textarea
                id="seoDescription"
                {...form.register('seoDescription')}
                placeholder="Descripción optimizada para motores de búsqueda"
                maxLength={160}
                rows={3}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Máximo 160 caracteres • {form.watch('seoDescription')?.length || 0}/160
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Featured */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Producto Destacado</Label>
                <p className="text-sm text-muted-foreground">
                  Aparecerá en la sección de productos destacados
                </p>
              </div>
              <Switch
                checked={form.watch('featured')}
                onCheckedChange={(checked) => form.setValue('featured', checked)}
                disabled={isSubmitting}
              />
            </div>

            <Separator />

            {/* Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Producto Activo</Label>
                <p className="text-sm text-muted-foreground">
                  El producto estará visible en la tienda
                </p>
              </div>
              <Switch
                checked={form.watch('active')}
                onCheckedChange={(checked) => form.setValue('active', checked)}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Note about images */}
        {mode === 'create' && (
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Nota:</strong> Podrás agregar imágenes y crear variantes después de guardar el producto.
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
