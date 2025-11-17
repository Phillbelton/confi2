'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CategorySelector } from './CategorySelector';
import { BrandSelector } from './BrandSelector';
import { TagSelector } from './TagSelector';
import { ImageUploaderWithPreview } from './ImageUploaderWithPreview';

const simpleProductSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  categories: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  stock: z.number().min(0, 'El stock no puede ser negativo').int('El stock debe ser un número entero'),
  sku: z.string().optional(),
  seoTitle: z.string().max(70, 'El título SEO no puede exceder 70 caracteres').optional(),
  seoDescription: z.string().max(160, 'La descripción SEO no puede exceder 160 caracteres').optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

type SimpleProductFormValues = z.infer<typeof simpleProductSchema>;

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface SimpleProductFormProps {
  onSubmit: (data: SimpleProductFormValues, images: File[]) => void | Promise<void>;
  onSubmitAndCreateAnother?: (data: SimpleProductFormValues, images: File[]) => void | Promise<void>;
  isSubmitting: boolean;
}

export function SimpleProductForm({
  onSubmit,
  onSubmitAndCreateAnother,
  isSubmitting,
}: SimpleProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<ImageFile[]>([]);

  const form = useForm<SimpleProductFormValues>({
    resolver: zodResolver(simpleProductSchema),
    defaultValues: {
      name: '',
      description: '',
      categories: [],
      brand: '',
      tags: [],
      price: 0,
      stock: 0,
      sku: '',
      seoTitle: '',
      seoDescription: '',
      featured: false,
      active: true,
    },
  });

  const handleFormSubmit = async (values: SimpleProductFormValues, createAnother: boolean = false) => {
    const imageFiles = images.map((img) => img.file);

    if (createAnother && onSubmitAndCreateAnother) {
      await onSubmitAndCreateAnother(values, imageFiles);
      // Limpiar formulario
      form.reset();
      setImages([]);
    } else {
      await onSubmit(values, imageFiles);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crear Producto Simple</h1>
            <p className="text-muted-foreground">
              Producto con un solo precio y stock
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onSubmitAndCreateAnother && (
            <Button
              onClick={form.handleSubmit((data) => handleFormSubmit(data, true))}
              disabled={isSubmitting}
              variant="outline"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Guardar y Crear Otro
                </>
              )}
            </Button>
          )}
          <Button
            onClick={form.handleSubmit((data) => handleFormSubmit(data, false))}
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
                Guardar Producto
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit((data) => handleFormSubmit(data, false))} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Ej: Chocolate Premium 250g"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

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

            <BrandSelector
              selectedId={form.watch('brand')}
              onChange={(id) => form.setValue('brand', id)}
              disabled={isSubmitting}
            />

            <TagSelector
              selectedIds={form.watch('tags') || []}
              onChange={(ids) => form.setValue('tags', ids)}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Precio y Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Precio y Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio (Gs) *</Label>
                <Input
                  id="price"
                  type="number"
                  {...form.register('price', { valueAsNumber: true })}
                  placeholder="5000"
                  disabled={isSubmitting}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="stock">Stock (unidades) *</Label>
                <Input
                  id="stock"
                  type="number"
                  {...form.register('stock', { valueAsNumber: true })}
                  placeholder="100"
                  disabled={isSubmitting}
                />
                {form.formState.errors.stock && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.stock.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="sku">
                  SKU (opcional)
                  <span className="text-xs text-muted-foreground ml-2">
                    Se genera automático
                  </span>
                </Label>
                <Input
                  id="sku"
                  {...form.register('sku')}
                  placeholder="CHOCOLATE-PREMIUM-250G"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploaderWithPreview
              images={images}
              onChange={setImages}
              maxImages={5}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                {form.watch('seoTitle')?.length || 0}/70
              </p>
            </div>

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
                {form.watch('seoDescription')?.length || 0}/160
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
      </form>
    </div>
  );
}
