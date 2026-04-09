'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FormFieldWithHelp } from '@/components/ui/form-field-with-help';
import { InlineHelp } from '@/components/ui/inline-help';
import { CategoryWithSubcategorySelector } from './CategoryWithSubcategorySelector';
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

function CollapsibleCard({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {open && <CardContent className="space-y-4 pt-0">{children}</CardContent>}
    </Card>
  );
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
      form.reset();
      setImages([]);
    } else {
      await onSubmit(values, imageFiles);
    }
  };

  const SaveButtons = ({ className }: { className?: string }) => (
    <div className={`flex gap-2 ${className ?? ''}`}>
      {onSubmitAndCreateAnother && (
        <Button
          type="button"
          onClick={form.handleSubmit((data) => handleFormSubmit(data, true))}
          disabled={isSubmitting}
          variant="outline"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Guardar y Crear Otro
        </Button>
      )}
      <Button
        type="button"
        onClick={form.handleSubmit((data) => handleFormSubmit(data, false))}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Guardar Producto
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Crear Producto Simple</h1>
            <p className="text-muted-foreground">Producto con un solo precio</p>
          </div>
        </div>
        <SaveButtons />
      </div>

      <form onSubmit={form.handleSubmit((data) => handleFormSubmit(data, false))} className="space-y-6">

        {/* 1. Nombre y descripción */}
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
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe el producto en detalle..."
                rows={4}
                disabled={isSubmitting}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Precio y SKU */}
        <Card>
          <CardHeader>
            <CardTitle>Precio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldWithHelp
                label="Precio ($)"
                htmlFor="price"
                tooltip="Precio base en pesos chilenos. Los descuentos se configuran por separado."
                required
              >
                <Input
                  id="price"
                  type="number"
                  {...form.register('price', { valueAsNumber: true })}
                  placeholder="5000"
                  disabled={isSubmitting}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.price.message}</p>
                )}
              </FormFieldWithHelp>

              <FormFieldWithHelp
                label="SKU"
                htmlFor="sku"
                tooltip="Código único del producto. Se genera automáticamente si lo dejas vacío."
              >
                <Input
                  id="sku"
                  {...form.register('sku')}
                  placeholder="CHOC-PREM-250G"
                  disabled={isSubmitting}
                />
              </FormFieldWithHelp>
            </div>
          </CardContent>
        </Card>

        {/* 3. Categoría, Marca y Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Clasificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryWithSubcategorySelector
              selectedIds={form.watch('categories') || []}
              onChange={(ids) => form.setValue('categories', ids)}
              disabled={isSubmitting}
            />
            {form.formState.errors.categories && (
              <p className="text-sm text-destructive mt-1">
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

        {/* 4. Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InlineHelp variant="info">
              Hasta 5 imágenes. La <strong>primera</strong> se mostrará en el catálogo.
              Mínimo 800×800px. Formatos: JPG, PNG, WEBP.
            </InlineHelp>
            <ImageUploaderWithPreview
              images={images}
              onChange={setImages}
              maxImages={5}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* 5. SEO — colapsable */}
        <CollapsibleCard title="SEO (Opcional)">
          <FormFieldWithHelp
            label="Título SEO"
            htmlFor="seoTitle"
            tooltip="Aparece en resultados de búsqueda (Google). Si lo dejas vacío, se usa el nombre. Máx. 70 caracteres."
          >
            <Input
              id="seoTitle"
              {...form.register('seoTitle')}
              placeholder="Título optimizado para buscadores"
              maxLength={70}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.watch('seoTitle')?.length ?? 0}/70
            </p>
          </FormFieldWithHelp>

          <FormFieldWithHelp
            label="Descripción SEO"
            htmlFor="seoDescription"
            tooltip="Aparece debajo del título en resultados de búsqueda. Máx. 160 caracteres."
          >
            <Textarea
              id="seoDescription"
              {...form.register('seoDescription')}
              placeholder="Descripción optimizada para buscadores"
              maxLength={160}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.watch('seoDescription')?.length ?? 0}/160
            </p>
          </FormFieldWithHelp>
        </CollapsibleCard>

        {/* 6. Configuración — colapsable */}
        <CollapsibleCard title="Configuración">
          <div className="flex items-center justify-between">
            <FormFieldWithHelp
              label="Producto Destacado"
              tooltip="Aparecerá en la sección de productos destacados en la página principal."
              className="flex-1"
            >
              <p className="text-sm text-muted-foreground">
                Aparecerá en la sección de destacados
              </p>
            </FormFieldWithHelp>
            <Switch
              checked={form.watch('featured')}
              onCheckedChange={(checked) => form.setValue('featured', checked)}
              disabled={isSubmitting}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <FormFieldWithHelp
              label="Producto Activo"
              tooltip="Desactívalo para ocultarlo temporalmente sin eliminarlo."
              className="flex-1"
            >
              <p className="text-sm text-muted-foreground">
                El producto estará visible en la tienda
              </p>
            </FormFieldWithHelp>
            <Switch
              checked={form.watch('active')}
              onCheckedChange={(checked) => form.setValue('active', checked)}
              disabled={isSubmitting}
            />
          </div>
        </CollapsibleCard>

        {/* Botones al final del formulario */}
        <div className="flex justify-end pb-8">
          <SaveButtons />
        </div>
      </form>
    </div>
  );
}
