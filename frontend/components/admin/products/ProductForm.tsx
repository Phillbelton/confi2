'use client';

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Box, Eye, Loader2, PackageOpen, Plus, Save, Trash2, Hash,
  Sparkles, TrendingDown, ScanLine, X,
} from 'lucide-react';
import { getImageUrl } from '@/lib/images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { CategoryWithSubcategorySelector } from './CategoryWithSubcategorySelector';
import { BrandSelector } from './BrandSelector';
import { ImageUploaderWithPreview } from './ImageUploaderWithPreview';
import { FormatPicker, FlavorPicker } from './QuickFormatFlavorPicker';
import { ProductLivePreview } from './ProductLivePreview';
import { ExtraPresentationsEditor, type ExtraPresentation } from './ExtraPresentationsEditor';
import { usePublicFormats, usePublicFlavors } from '@/hooks/admin/useFormatsFlavors';
import { categoryService } from '@/services/categories';
import type { SaleUnitType, FacetableAttribute } from '@/types';
import { cn } from '@/lib/utils';

const tierSchema = z.object({
  minQuantity: z.number().int().min(2),
  pricePerUnit: z.number().min(0),
  label: z.string().max(40).optional(),
});

const productSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres'),
  categories: z.array(z.string()).min(1, 'Al menos una categoría'),
  brand: z.string().optional(),
  format: z.string().optional(),
  flavor: z.string().optional(),
  sku: z.string().trim().max(40).optional(),
  barcode: z.string().max(32).optional(),
  unitPrice: z.number().min(0),
  saleUnit: z.object({
    type: z.enum(['unidad', 'cantidadMinima', 'display', 'embalaje']),
    quantity: z.number().int().min(1),
  }),
  tiers: z.array(tierSchema).optional(),
  // Presentaciones completas (se arman al guardar: principal + adicionales).
  presentaciones: z
    .array(
      z.object({
        _id: z.string().optional(),
        type: z.enum(['unidad', 'cantidadMinima', 'display', 'embalaje']),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
        tiers: z.array(tierSchema).optional(),
        label: z.string().max(40).optional(),
        principal: z.boolean().optional(),
      })
    )
    .optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  attributes: z.record(z.string(), z.array(z.string())).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ImageFile { file: File; preview: string; id: string; }

interface ProductFormProps {
  onSubmit: (data: ProductFormValues, images: File[]) => void | Promise<void>;
  isSubmitting: boolean;
  defaultValues?: Partial<ProductFormValues>;
  defaultImages?: string[];
  isEditing?: boolean;
  /** Borra una imagen ya guardada del producto (solo edición). Recibe el
   *  filename (no la URL completa). Debe resolver cuando el backend confirmó. */
  onDeleteImage?: (filename: string) => Promise<unknown>;
}

const SALE_UNIT_LABELS: Record<SaleUnitType, string> = {
  unidad: 'Unidad',
  cantidadMinima: 'Cantidad mínima',
  display: 'Display',
  embalaje: 'Embalaje',
};

const SALE_UNIT_DESC: Record<SaleUnitType, string> = {
  unidad: 'Se vende suelto, una a la vez (1 Unid.)',
  cantidadMinima: 'Mínimo X unidades para comprar (Cant. min N Unid.)',
  display: 'Caja con N unidades sellada (Display N Unid.)',
  embalaje: 'Caja master con N unidades (Embalaje N Unid.)',
};

const SALE_UNIT_ICON: Record<SaleUnitType, React.ComponentType<{ className?: string }>> = {
  unidad: Hash,
  cantidadMinima: Hash,
  display: PackageOpen,
  embalaje: Box,
};

export function ProductForm({
  onSubmit, isSubmitting, defaultValues, defaultImages = [], isEditing, onDeleteImage,
}: ProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<ImageFile[]>([]);
  // Imágenes YA guardadas del producto (URLs /uploads). Copia local para poder
  // removerlas de la UI al borrarlas sin esperar un refetch completo.
  const [existingImages, setExistingImages] = useState<string[]>(defaultImages);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  // Presentaciones adicionales (la principal vive en el bloque "Venta y precios").
  const [extraPres, setExtraPres] = useState<ExtraPresentation[]>(() =>
    (defaultValues?.presentaciones ?? [])
      .filter((p) => !p.principal)
      .map((p) => ({
        type: p.type,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        tiers: p.tiers ?? [],
        label: p.label,
      }))
  );

  const handleDeleteExisting = async (url: string) => {
    if (!onDeleteImage) return;
    const filename = url.split('/').pop();
    if (!filename) return;
    setDeletingUrl(url);
    try {
      await onDeleteImage(filename);
      setExistingImages((prev) => prev.filter((u) => u !== url));
    } catch {
      /* el hook ya muestra el toast de error */
    } finally {
      setDeletingUrl(null);
    }
  };
  const { data: formats } = usePublicFormats();
  const { data: flavors } = usePublicFlavors();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      categories: [],
      unitPrice: 0,
      saleUnit: { type: 'unidad', quantity: 1 },
      tiers: [],
      active: true,
      featured: false,
      attributes: {},
      ...defaultValues,
    },
  });

  // useWatch (compatible con React Compiler) en lugar de form.watch() que
  // rompía la memoización. Sin `name`, devuelve el objeto completo de
  // valores del form — drop-in replacement para `form.watch()`.
  //
  // Cast a ProductFormValues: el tipo de useWatch es DeepPartial<T> porque
  // RHF no puede saber estáticamente si los defaults están seteados. En
  // este form todos los defaultValues están definidos en useForm() arriba,
  // así que en runtime todos los campos están presentes desde el primer
  // render — el cast es seguro.
  const watch = useWatch({ control: form.control }) as ProductFormValues;
  const selectedCategories = watch.categories || [];

  // Attributes efectivos según las categorías seleccionadas. useQuery
  // reemplaza un useEffect + useState + cleanup manual: maneja
  // cancelación, caché, dedup de requests en vuelo y errores sin tocar
  // estado dentro del effect (lo que provocaba set-state-in-effect).
  const selectedCategoriesKey = selectedCategories.join(',');
  const { data: effectiveAttributes = [] } = useQuery<FacetableAttribute[]>({
    queryKey: ['admin-facetable-attributes', selectedCategoriesKey],
    queryFn: async () => {
      if (selectedCategories.length === 0) return [];
      const results = await Promise.all(
        selectedCategories.map((id) => categoryService.getFacetableAttributes(id))
      );
      const dedup = new Map<string, FacetableAttribute>();
      for (const list of results) {
        for (const attr of list) {
          if (!dedup.has(attr.key)) dedup.set(attr.key, attr);
        }
      }
      return Array.from(dedup.values()).sort((a, b) => a.order - b.order);
    },
    placeholderData: (prev) => prev,
  });
  const tiers = watch.tiers || [];

  // Vista previa: construye datos para el LivePreview
  const formatLabel = useMemo(
    () => formats?.find((f) => f._id === watch.format)?.label,
    [formats, watch.format]
  );
  const flavorObj = useMemo(
    () => flavors?.find((f) => f._id === watch.flavor),
    [flavors, watch.flavor]
  );
  const previewImage = images[0]?.preview || existingImages[0];

  // Operaciones de tiers
  const addTier = () => {
    const next = tiers.length === 0
      ? { minQuantity: 12, pricePerUnit: Math.max(1, Math.round(watch.unitPrice * 0.92)), label: 'Display' }
      : { minQuantity: tiers[tiers.length - 1].minQuantity * 2, pricePerUnit: Math.max(1, Math.round(tiers[tiers.length - 1].pricePerUnit * 0.92)), label: '' };
    form.setValue('tiers', [...tiers, next]);
  };
  const removeTier = (i: number) => form.setValue('tiers', tiers.filter((_, n) => n !== i));
  const updateTier = <K extends keyof typeof tiers[0]>(
    i: number,
    key: K,
    val: (typeof tiers)[0][K]
  ) =>
    form.setValue('tiers', tiers.map((t, n) => (n === i ? { ...t, [key]: val } : t)));

  // Helper: discount % por tier
  const tierDiscountPercent = (ppu: number) =>
    watch.unitPrice > 0 ? Math.round((1 - ppu / watch.unitPrice) * 100) : 0;

  const handle = async (values: ProductFormValues) => {
    // Armamos presentaciones[]: la principal (bloque "Venta y precios") + las
    // adicionales del repetidor. Se mandan junto a los campos legacy (que el
    // backend sigue aceptando) y el modelo denormaliza desde la principal.
    const principal = {
      type: values.saleUnit.type,
      quantity: values.saleUnit.quantity,
      unitPrice: values.unitPrice,
      tiers: values.tiers ?? [],
      principal: true,
    };
    const extras = extraPres.map((e) => ({ ...e, principal: false }));
    await onSubmit(
      { ...values, presentaciones: [principal, ...extras] },
      images.map((i) => i.file)
    );
  };

  // Detect format from name (35g, 500ml)
  const suggestFormat = () => {
    const m = watch.name.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|l|cc|oz)\b/i);
    if (!m) return;
    const value = parseFloat(m[1].replace(',', '.'));
    let unit = m[2].toLowerCase();
    if (unit === 'gr') unit = 'g';
    const found = formats?.find((f) => f.value === value && f.unit === unit);
    if (found) form.setValue('format', found._id);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {isEditing ? 'Editar producto' : 'Nuevo producto'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Modificá los datos y guardá' : 'Completá el form — la vista previa se actualiza en vivo'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handle)}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* COL IZQUIERDA — FORM */}
          <div className="space-y-5">
            {/* Identificación */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📋 Identificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="name" className="text-sm font-semibold">Nombre *</Label>
                    {watch.name && /\d+\s*(g|gr|kg|ml|l|cc|oz)\b/i.test(watch.name) && !watch.format && (
                      <Button type="button" size="sm" variant="ghost" onClick={suggestFormat} className="h-6 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Detectar formato del nombre
                      </Button>
                    )}
                  </div>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Ej: Galleta SELZ Mini Clásica 35g"
                    className="text-base"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-semibold">Descripción *</Label>
                  <Textarea id="description" {...form.register('description')} rows={2} placeholder="Descripción visible al cliente" />
                  {form.formState.errors.description && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="sku" className="text-xs flex items-center gap-1">
                      <Hash className="h-3 w-3" />SKU
                    </Label>
                    <Input
                      id="sku"
                      {...form.register('sku')}
                      placeholder={isEditing ? '' : 'Auto: QU-XXXXXX'}
                      readOnly={isEditing}
                      className={cn(
                        'font-mono uppercase',
                        isEditing && 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                      )}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {isEditing
                        ? 'Identidad del producto — no editable.'
                        : 'Dejalo vacío para auto-generar, o ingresá uno para sincronizar con el Excel.'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="barcode" className="text-xs flex items-center gap-1">
                      <ScanLine className="h-3 w-3" />Código de barras
                    </Label>
                    <Input id="barcode" {...form.register('barcode')} placeholder="7802408003446" inputMode="numeric" className="font-mono" />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      EAN del fabricante. Opcional.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clasificación */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">🏷️ Clasificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CategoryWithSubcategorySelector
                  selectedIds={watch.categories || []}
                  onChange={(ids) => form.setValue('categories', ids)}
                  disabled={isSubmitting}
                />
                {form.formState.errors.categories && (
                  <p className="text-xs text-destructive">{form.formState.errors.categories.message}</p>
                )}
                <BrandSelector
                  selectedId={watch.brand}
                  onChange={(id) => form.setValue('brand', id)}
                  disabled={isSubmitting}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormatPicker
                    value={watch.format}
                    onChange={(id) => form.setValue('format', id)}
                    disabled={isSubmitting}
                  />
                  <FlavorPicker
                    value={watch.flavor}
                    onChange={(id) => form.setValue('flavor', id)}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Atributos dinámicos según categorías */}
            {effectiveAttributes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🎯 Atributos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {effectiveAttributes.map((attr) => {
                    const current = (watch.attributes || {})[attr.key] || [];
                    const setValues = (vals: string[]) => {
                      const next = { ...(watch.attributes || {}) };
                      if (vals.length === 0) delete next[attr.key];
                      else next[attr.key] = vals;
                      form.setValue('attributes', next);
                    };
                    return (
                      <div key={attr.key}>
                        <Label className="text-sm font-semibold">{attr.label}</Label>
                        {attr.multiSelect ? (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {attr.options.map((opt) => {
                              const active = current.includes(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setValues(
                                      active
                                        ? current.filter((v) => v !== opt.value)
                                        : [...current, opt.value]
                                    )
                                  }
                                  className={cn(
                                    'rounded-full border px-3 py-1 text-xs transition-colors',
                                    active
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border hover:border-primary/40'
                                  )}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <Select
                            value={current[0] || ''}
                            onValueChange={(v) => setValues(v ? [v] : [])}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={`Seleccionar ${attr.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {attr.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Venta */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">💰 Venta y precios · presentación principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Precio + modo en grid */}
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Precio por unidad *</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        {...form.register('unitPrice', { valueAsNumber: true })}
                        className="pl-7 text-lg font-bold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">¿Cómo se vende?</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Aparece como badge en la imagen del producto
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {(Object.keys(SALE_UNIT_LABELS) as SaleUnitType[]).map((k) => {
                        const Icon = SALE_UNIT_ICON[k];
                        const active = watch.saleUnit.type === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => form.setValue('saleUnit', {
                              type: k,
                              quantity: k === 'unidad' ? 1 : (watch.saleUnit.quantity || 6),
                            })}
                            className={cn(
                              'rounded-lg border-2 p-2 text-left transition-all',
                              active
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/40'
                            )}
                          >
                            <Icon className={cn('h-4 w-4 mb-1', active && 'text-primary')} />
                            <p className="text-xs font-bold">{SALE_UNIT_LABELS[k]}</p>
                          </button>
                        );
                      })}
                    </div>
                    {watch.saleUnit.type !== 'unidad' && (
                      <div className="mt-2">
                        <Label className="text-xs">Cantidad de unidades</Label>
                        <Input
                          type="number"
                          min={1}
                          value={watch.saleUnit.quantity}
                          onChange={(e) => form.setValue('saleUnit', {
                            type: watch.saleUnit.type,
                            quantity: parseInt(e.target.value, 10) || 1,
                          })}
                          placeholder="6"
                        />
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      💡 {SALE_UNIT_DESC[watch.saleUnit.type]}
                    </p>
                  </div>
                </div>

                {/* Tiers */}
                <div className="rounded-xl border-2 border-dashed border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-1.5">
                        <TrendingDown className="h-4 w-4 text-primary" />
                        Tramos por mayor
                      </Label>
                      <p className="text-xs text-muted-foreground">Precios escalonados según cantidad</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={addTier} disabled={watch.unitPrice <= 0}>
                      <Plus className="h-3 w-3 mr-1" />Agregar tramo
                    </Button>
                  </div>

                  {tiers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Sin tramos. El cliente paga ${watch.unitPrice || 0} por unidad sin importar cantidad.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tiers.map((t, i) => {
                        const dcto = tierDiscountPercent(t.pricePerUnit);
                        const totalAtTier = t.pricePerUnit * t.minQuantity;
                        return (
                          <div key={i} className="rounded-lg bg-muted/40 p-2 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                              <Label className="text-[10px] uppercase">Desde</Label>
                              <Input
                                type="number"
                                min={2}
                                value={t.minQuantity}
                                onChange={(e) => updateTier(i, 'minQuantity', parseInt(e.target.value, 10) || 2)}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-[10px] uppercase">Precio c/u</Label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                <Input
                                  type="number"
                                  min={0}
                                  value={t.pricePerUnit}
                                  onChange={(e) => updateTier(i, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                  className="h-8 pl-5 tabular-nums"
                                />
                              </div>
                            </div>
                            <div className="col-span-3">
                              <Label className="text-[10px] uppercase">Etiqueta</Label>
                              <Input
                                value={t.label || ''}
                                onChange={(e) => updateTier(i, 'label', e.target.value)}
                                placeholder="Display, Mayor…"
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-2 text-right text-xs">
                              {dcto > 0 && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                                  −{dcto}%
                                </Badge>
                              )}
                              <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                                = ${totalAtTier.toLocaleString('es-CL')}
                              </p>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeTier(i)} className="text-destructive h-8 w-8 p-0">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Otras presentaciones */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📦 Otras presentaciones</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Si este producto también se vende por display, caja u otra forma, agregalas acá
                  (cada una con su precio y tramos). El cliente las elige en la ficha.
                </p>
              </CardHeader>
              <CardContent>
                <ExtraPresentationsEditor value={extraPres} onChange={setExtraPres} />
              </CardContent>
            </Card>

            {/* Imágenes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📸 Imágenes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Imágenes ya guardadas del producto (solo en edición). */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Imágenes actuales
                      <span className="ml-2 text-xs text-muted-foreground">
                        La primera es la principal
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                      {existingImages.map((url, index) => (
                        <div
                          key={url}
                          className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(url)}
                            alt={`Imagen ${index + 1}`}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          {index === 0 && (
                            <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                              Principal
                            </span>
                          )}
                          {onDeleteImage && (
                            <button
                              type="button"
                              onClick={() => handleDeleteExisting(url)}
                              disabled={isSubmitting || deletingUrl === url}
                              aria-label="Eliminar imagen"
                              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white opacity-0 shadow transition-opacity hover:bg-red-700 group-hover:opacity-100 disabled:opacity-60"
                            >
                              {deletingUrl === url ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subir imágenes nuevas (se aplican al guardar). */}
                <ImageUploaderWithPreview
                  images={images}
                  onChange={setImages}
                  maxImages={Math.max(0, 5 - existingImages.length)}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>

            {/* Visibilidad */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">👁️ Visibilidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div>
                    <Label className="font-semibold">Producto activo</Label>
                    <p className="text-xs text-muted-foreground">Visible en el catálogo público</p>
                  </div>
                  <Switch checked={!!watch.active} onCheckedChange={(c) => form.setValue('active', c)} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div>
                    <Label className="font-semibold">Destacado ⭐</Label>
                    <p className="text-xs text-muted-foreground">Aparece en sección destacados del home</p>
                  </div>
                  <Switch checked={!!watch.featured} onCheckedChange={(c) => form.setValue('featured', c)} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COL DERECHA — PREVIEW (solo desktop; en móvil va en el sheet) */}
          <div className="hidden lg:block">
            <ProductLivePreview
              name={watch.name}
              unitPrice={watch.unitPrice}
              saleUnit={watch.saleUnit}
              tiers={tiers}
              imagePreview={previewImage}
              formatLabel={formatLabel}
              flavorName={flavorObj?.name}
            />
          </div>
        </div>

        {/* PREVIEW MÓVIL — botón flotante sobre la barra de guardar que abre
            un sheet inferior. En pantallas chicas la columna derecha quedaba
            al fondo de la página y dejaba de servir como vista "en vivo". */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="fixed bottom-20 right-4 z-30 rounded-full border border-border shadow-lg"
              >
                <Eye className="mr-2 h-4 w-4" />
                Vista previa
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto p-4 pt-10">
              <SheetTitle className="sr-only">Vista previa del cliente</SheetTitle>
              <ProductLivePreview
                name={watch.name}
                unitPrice={watch.unitPrice}
                saleUnit={watch.saleUnit}
                tiers={tiers}
                imagePreview={previewImage}
                formatLabel={formatLabel}
                flavorName={flavorObj?.name}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* STICKY SAVE BAR */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur shadow-lg">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 gap-3 lg:px-8">
            <div className="text-xs text-muted-foreground hidden md:block">
              {Object.keys(form.formState.errors).length > 0 && (
                <span className="text-destructive font-semibold">
                  ⚠ {Object.keys(form.formState.errors).length} error(es) — revisá el form
                </span>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Save className="mr-2 h-4 w-4" />}
                {isEditing ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export function badgeText(type: SaleUnitType, quantity: number): string {
  switch (type) {
    case 'unidad': return '1 Unid.';
    case 'cantidadMinima': return `Cant. min ${quantity} Unid.`;
    case 'display': return `Display ${quantity} Unid.`;
    case 'embalaje': return `Embalaje ${quantity} Unid.`;
  }
}
