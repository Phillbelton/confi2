'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Box, Loader2, Package, PackageOpen, Plus, Save, Trash2, Hash,
  Sparkles, TrendingDown, ScanLine,
} from 'lucide-react';
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
import { CategoryWithSubcategorySelector } from './CategoryWithSubcategorySelector';
import { BrandSelector } from './BrandSelector';
import { ImageUploaderWithPreview } from './ImageUploaderWithPreview';
import { FormatPicker, FlavorPicker } from './QuickFormatFlavorPicker';
import { ProductLivePreview } from './ProductLivePreview';
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
  barcode: z.string().max(32).optional(),
  provider: z.string().max(120).optional(),
  unitPrice: z.number().min(0),
  saleUnit: z.object({
    type: z.enum(['unidad', 'cantidadMinima', 'display', 'embalaje']),
    quantity: z.number().int().min(1),
  }),
  tiers: z.array(tierSchema).optional(),
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
  onSubmit, isSubmitting, defaultValues, defaultImages = [], isEditing,
}: ProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<ImageFile[]>([]);
  const { data: formats } = usePublicFormats();
  const { data: flavors } = usePublicFlavors();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
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

  const watch = form.watch();
  const selectedCategories = watch.categories || [];

  // Cargar attributes efectivos cuando cambian las categorías seleccionadas
  const [effectiveAttributes, setEffectiveAttributes] = useState<FacetableAttribute[]>([]);
  useEffect(() => {
    if (!selectedCategories || selectedCategories.length === 0) {
      setEffectiveAttributes([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      selectedCategories.map((id) => categoryService.getFacetableAttributes(id))
    )
      .then((results) => {
        if (cancelled) return;
        const dedup = new Map<string, FacetableAttribute>();
        for (const list of results) {
          for (const attr of list) {
            if (!dedup.has(attr.key)) dedup.set(attr.key, attr);
          }
        }
        setEffectiveAttributes(
          Array.from(dedup.values()).sort((a, b) => a.order - b.order)
        );
      })
      .catch(() => {
        if (!cancelled) setEffectiveAttributes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategories.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
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
  const previewImage = images[0]?.preview || defaultImages[0];

  // Operaciones de tiers
  const addTier = () => {
    const next = tiers.length === 0
      ? { minQuantity: 12, pricePerUnit: Math.max(1, Math.round(watch.unitPrice * 0.92)), label: 'Display' }
      : { minQuantity: tiers[tiers.length - 1].minQuantity * 2, pricePerUnit: Math.max(1, Math.round(tiers[tiers.length - 1].pricePerUnit * 0.92)), label: '' };
    form.setValue('tiers', [...tiers, next]);
  };
  const removeTier = (i: number) => form.setValue('tiers', tiers.filter((_, n) => n !== i));
  const updateTier = (i: number, key: keyof typeof tiers[0], val: any) =>
    form.setValue('tiers', tiers.map((t, n) => n === i ? { ...t, [key]: val } : t));

  // Helper: discount % por tier
  const tierDiscountPercent = (ppu: number) =>
    watch.unitPrice > 0 ? Math.round((1 - ppu / watch.unitPrice) * 100) : 0;

  const handle = async (values: ProductFormValues) => {
    await onSubmit(values, images.map((i) => i.file));
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
                    <Label htmlFor="barcode" className="text-xs flex items-center gap-1">
                      <ScanLine className="h-3 w-3" />Código de barras
                    </Label>
                    <Input id="barcode" {...form.register('barcode')} placeholder="7802408003446" inputMode="numeric" className="font-mono" />
                  </div>
                  <div>
                    <Label htmlFor="provider" className="text-xs">Proveedor (interno)</Label>
                    <Input id="provider" {...form.register('provider')} placeholder="FRUNA 14" />
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
                  selectedIds={form.watch('categories') || []}
                  onChange={(ids) => form.setValue('categories', ids)}
                  disabled={isSubmitting}
                />
                {form.formState.errors.categories && (
                  <p className="text-xs text-destructive">{form.formState.errors.categories.message}</p>
                )}
                <BrandSelector
                  selectedId={form.watch('brand')}
                  onChange={(id) => form.setValue('brand', id)}
                  disabled={isSubmitting}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormatPicker
                    value={form.watch('format')}
                    onChange={(id) => form.setValue('format', id)}
                    disabled={isSubmitting}
                  />
                  <FlavorPicker
                    value={form.watch('flavor')}
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
                <CardTitle className="text-base">💰 Venta y precios</CardTitle>
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

            {/* Imágenes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📸 Imágenes</CardTitle>
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
                  <Switch checked={form.watch('active')} onCheckedChange={(c) => form.setValue('active', c)} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div>
                    <Label className="font-semibold">Destacado ⭐</Label>
                    <p className="text-xs text-muted-foreground">Aparece en sección destacados del home</p>
                  </div>
                  <Switch checked={form.watch('featured')} onCheckedChange={(c) => form.setValue('featured', c)} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COL DERECHA — PREVIEW */}
          <div>
            <ProductLivePreview
              name={watch.name}
              unitPrice={watch.unitPrice}
              saleUnit={watch.saleUnit}
              tiers={tiers}
              imagePreview={previewImage}
              formatLabel={formatLabel}
              flavorName={flavorObj?.name}
              flavorColor={flavorObj?.color}
            />
          </div>
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
