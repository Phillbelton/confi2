'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Save, Plus, Trash2 } from 'lucide-react';
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
import { VariantConfigurationTable, VariantCombination } from './VariantConfigurationTable';

const variantProductSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  categories: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(70, 'El título SEO no puede exceder 70 caracteres').optional(),
  seoDescription: z.string().max(160, 'La descripción SEO no puede exceder 160 caracteres').optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

type VariantProductFormValues = z.infer<typeof variantProductSchema>;

interface VariantAttribute {
  id: string;
  name: string;
  values: string[];
}

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface VariantProductFormProps {
  onSubmit: (
    data: VariantProductFormValues,
    parentImages: File[],
    variantAttributes: VariantAttribute[],
    variantCombinations: VariantCombination[]
  ) => void | Promise<void>;
  onSubmitAndCreateAnother?: (
    data: VariantProductFormValues,
    parentImages: File[],
    variantAttributes: VariantAttribute[],
    variantCombinations: VariantCombination[]
  ) => void | Promise<void>;
  isSubmitting: boolean;
}

export function VariantProductForm({
  onSubmit,
  onSubmitAndCreateAnother,
  isSubmitting,
}: VariantProductFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');

  const form = useForm<VariantProductFormValues>({
    resolver: zodResolver(variantProductSchema),
    defaultValues: {
      name: '',
      description: '',
      categories: [],
      brand: '',
      tags: [],
      seoTitle: '',
      seoDescription: '',
      featured: false,
      active: true,
    },
  });

  // Generate all combinations from variant attributes
  const generateCombinations = (attributes: VariantAttribute[]): VariantCombination[] => {
    if (attributes.length === 0) return [];

    const combinations: VariantCombination[] = [];

    const generate = (currentAttrs: Record<string, string>, attrIndex: number) => {
      if (attrIndex === attributes.length) {
        combinations.push({
          id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          attributes: { ...currentAttrs },
          price: 0,
          stock: 0,
        });
        return;
      }

      const attr = attributes[attrIndex];
      for (const value of attr.values) {
        generate({ ...currentAttrs, [attr.name]: value }, attrIndex + 1);
      }
    };

    generate({}, 0);
    return combinations;
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim() || !newAttrValues.trim()) return;

    const values = newAttrValues
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (values.length === 0) return;

    const newAttr: VariantAttribute = {
      id: `attr-${Date.now()}`,
      name: newAttrName.trim(),
      values,
    };

    const updatedAttributes = [...variantAttributes, newAttr];
    setVariantAttributes(updatedAttributes);

    // Regenerate combinations
    const newCombinations = generateCombinations(updatedAttributes);
    setVariantCombinations(newCombinations);

    // Reset inputs
    setNewAttrName('');
    setNewAttrValues('');
  };

  const handleRemoveAttribute = (id: string) => {
    const updatedAttributes = variantAttributes.filter((attr) => attr.id !== id);
    setVariantAttributes(updatedAttributes);

    // Regenerate combinations
    const newCombinations = generateCombinations(updatedAttributes);
    setVariantCombinations(newCombinations);
  };

  const handleNextStep = () => {
    if (variantAttributes.length === 0) {
      alert('Debes definir al menos un atributo de variante');
      return;
    }
    setStep(2);
  };

  const handleFormSubmit = async (values: VariantProductFormValues, createAnother: boolean = false) => {
    // Validate that all combinations are configured
    const unconfigured = variantCombinations.filter((c) => c.price <= 0 || c.stock < 0);
    if (unconfigured.length > 0) {
      alert(`Hay ${unconfigured.length} variante(s) sin configurar. Configura precio y stock para todas.`);
      return;
    }

    const imageFiles = images.map((img) => img.file);

    if (createAnother && onSubmitAndCreateAnother) {
      await onSubmitAndCreateAnother(values, imageFiles, variantAttributes, variantCombinations);
      // Reset form
      form.reset();
      setImages([]);
      setVariantAttributes([]);
      setVariantCombinations([]);
      setStep(1);
    } else {
      await onSubmit(values, imageFiles, variantAttributes, variantCombinations);
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
            <h1 className="text-3xl font-bold tracking-tight">Crear Producto con Variantes</h1>
            <p className="text-muted-foreground">
              {step === 1
                ? 'Paso 1: Información básica y atributos de variantes'
                : 'Paso 2: Configurar precios y stock de variantes'}
            </p>
          </div>
        </div>
        {step === 2 && (
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
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-green-600 text-white'}`}>
          1
        </div>
        <div className={`h-1 w-24 ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          2
        </div>
      </div>

      <form className="space-y-6">
        {/* STEP 1: Basic Info + Variant Attributes */}
        {step === 1 && (
          <>
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
                    placeholder="Ej: Bebida Cola"
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

            {/* Atributos de Variantes */}
            <Card>
              <CardHeader>
                <CardTitle>Atributos de Variantes *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="attrName">Nombre del Atributo</Label>
                    <Input
                      id="attrName"
                      placeholder="Ej: Tamaño"
                      value={newAttrName}
                      onChange={(e) => setNewAttrName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="attrValues">Valores (separados por comas)</Label>
                    <Input
                      id="attrValues"
                      placeholder="Ej: 350ml, 500ml, 1L"
                      value={newAttrValues}
                      onChange={(e) => setNewAttrValues(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddAttribute}
                      disabled={isSubmitting || !newAttrName.trim() || !newAttrValues.trim()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Atributo
                    </Button>
                  </div>
                </div>

                {/* Current Attributes */}
                {variantAttributes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Atributos Definidos</Label>
                    {variantAttributes.map((attr) => (
                      <div
                        key={attr.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-md"
                      >
                        <div>
                          <p className="font-medium">{attr.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {attr.values.join(', ')}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttribute(attr.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-sm text-muted-foreground mt-2">
                      Esto generará {variantCombinations.length} variante(s)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Imágenes del Producto Padre */}
            <Card>
              <CardHeader>
                <CardTitle>Imágenes del Producto (Opcional)</CardTitle>
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

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting || variantAttributes.length === 0}
                size="lg"
              >
                Siguiente: Configurar Variantes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Variant Configuration */}
        {step === 2 && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Información Básica
            </Button>

            <VariantConfigurationTable
              combinations={variantCombinations}
              onChange={setVariantCombinations}
              disabled={isSubmitting}
            />
          </>
        )}
      </form>
    </div>
  );
}
