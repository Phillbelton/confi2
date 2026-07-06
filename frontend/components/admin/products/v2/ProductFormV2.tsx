'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, Circle, Eye, FileText, FolderHeart, Hash, Image as ImageIcon,
  Layers, Loader2, Save, ScanLine, Settings2, Sparkles, Tag, Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CategoryWithSubcategorySelector } from '../CategoryWithSubcategorySelector';
import { BrandSelector } from '../BrandSelector';
import { ImageUploaderWithPreview } from '../ImageUploaderWithPreview';
import { FormatPicker, FlavorMultiPicker } from '../QuickFormatFlavorPicker';
import {
  UnifiedPresentationsEditor, newPresentation, type PresentationDraft,
} from './UnifiedPresentationsEditor';
import { ProductCardPreview } from './ProductCardPreview';
import { usePublicFormats, usePublicFlavors } from '@/hooks/admin/useFormatsFlavors';
import { categoryService } from '@/services/categories';
import { brandService } from '@/services/brands';
import { adminCollectionService } from '@/services/admin/collections';
import type { CreateProductInput } from '@/services/admin/products';
import type { FacetableAttribute, Brand, Collection } from '@/types';
import { cn } from '@/lib/utils';

const baseSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres'),
  categories: z.array(z.string()).min(1, 'Al menos una categoría'),
  brand: z.string().optional(),
  format: z.string().optional(),
  flavors: z.array(z.string()).optional(),
  sku: z.string().trim().max(40).optional(),
  barcode: z.string().max(32).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  attributes: z.record(z.string(), z.array(z.string())).optional(),
});

type BaseValues = z.infer<typeof baseSchema>;

interface ImageFile { file: File; preview: string; id: string; }

export interface ProductV2Submit {
  payload: CreateProductInput;
  images: File[];
  collectionIds: string[];
}

interface Props {
  onSubmit: (data: ProductV2Submit) => void | Promise<void>;
  isSubmitting: boolean;
}

interface SectionDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Formulario de producto v2 — workspace de 3 zonas:
 *  - rail izquierdo (xl+): navegación por secciones con scrollspy,
 *  - centro: las secciones del formulario,
 *  - derecha (lg+): vista previa con la card REAL del catálogo + publicación
 *    con checklist de completitud.
 * Atajo Ctrl/Cmd+S para guardar.
 */
export function ProductFormV2({ onSubmit, isSubmitting }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [presentations, setPresentations] = useState<PresentationDraft[]>(() => [
    newPresentation({ type: 'unidad', quantity: 1, principal: true }),
  ]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [presError, setPresError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('sec-basico');

  const { data: formats } = usePublicFormats();
  const { data: flavors } = usePublicFlavors();
  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
    staleTime: 5 * 60_000,
  });
  const { data: collections } = useQuery<Collection[]>({
    queryKey: ['admin-collections', 'picker'],
    queryFn: () => adminCollectionService.getAll('all').then((r) => r.data.collections),
    staleTime: 60_000,
  });

  const form = useForm<BaseValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '', description: '', categories: [], flavors: [],
      sku: '', barcode: '', active: true, featured: false, attributes: {},
    },
  });

  const watch = useWatch({ control: form.control }) as BaseValues;
  const selectedCategories = watch.categories || [];
  const selectedCategoriesKey = selectedCategories.join(',');

  const { data: effectiveAttributes = [] } = useQuery<FacetableAttribute[]>({
    queryKey: ['admin-facetable-attributes', selectedCategoriesKey],
    queryFn: async () => {
      if (selectedCategories.length === 0) return [];
      const results = await Promise.all(
        selectedCategories.map((id) => categoryService.getFacetableAttributes(id))
      );
      const dedup = new Map<string, FacetableAttribute>();
      for (const list of results) for (const attr of list) if (!dedup.has(attr.key)) dedup.set(attr.key, attr);
      return Array.from(dedup.values()).sort((a, b) => a.order - b.order);
    },
    placeholderData: (prev) => prev,
  });
  const hasAttributes = effectiveAttributes.length > 0;

  // ---- Datos para el preview ----
  const formatLabel = useMemo(
    () => formats?.find((f) => f._id === watch.format)?.label,
    [formats, watch.format]
  );
  const brandName = useMemo(
    () => brands?.find((b) => b._id === watch.brand)?.name,
    [brands, watch.brand]
  );
  const flavorNames = useMemo(
    () => (watch.flavors || []).map((id) => flavors?.find((f) => f._id === id)?.name).filter(Boolean).join(', '),
    [flavors, watch.flavors]
  );
  const previewImage = images[0]?.preview;

  // ---- Checklist de publicación ----
  const principal = presentations.find((p) => p.principal) ?? presentations[0];
  const checks = useMemo(() => {
    const required = [
      { label: 'Nombre (mín. 3)', done: (watch.name || '').trim().length >= 3 },
      { label: 'Descripción (mín. 10)', done: (watch.description || '').trim().length >= 10 },
      { label: 'Al menos una categoría', done: selectedCategories.length > 0 },
      { label: 'Precio principal > $0', done: (principal?.unitPrice ?? 0) > 0 },
    ];
    const optional = [
      { label: 'Imagen de portada', done: images.length > 0 },
      { label: 'Marca', done: !!watch.brand },
      { label: 'Formato / gramaje', done: !!watch.format },
    ];
    return { required, optional };
  }, [watch.name, watch.description, watch.brand, watch.format, selectedCategories.length, principal?.unitPrice, images.length]);
  const requiredDone = checks.required.filter((c) => c.done).length;
  const progress = Math.round((requiredDone / checks.required.length) * 100);

  // ---- Secciones + scrollspy ----
  const sections = useMemo<SectionDef[]>(() => {
    const s: SectionDef[] = [
      { id: 'sec-basico', label: 'Información básica', icon: FileText },
      { id: 'sec-clasificacion', label: 'Clasificación', icon: Tag },
    ];
    if (hasAttributes) s.push({ id: 'sec-atributos', label: 'Atributos', icon: Settings2 });
    s.push(
      { id: 'sec-presentaciones', label: 'Presentaciones y precios', icon: Coins },
      { id: 'sec-imagenes', label: 'Imágenes', icon: ImageIcon },
      { id: 'sec-colecciones', label: 'Colecciones', icon: FolderHeart },
    );
    return s;
  }, [hasAttributes]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -65% 0px' }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---- Ctrl/Cmd+S = guardar ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- Detección de formato desde el nombre (35g, 500ml) ----
  const nameHasFormat = !!watch.name && /\d+\s*(g|gr|kg|ml|l|cc|oz)\b/i.test(watch.name);
  const suggestFormat = () => {
    const m = watch.name.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|l|cc|oz)\b/i);
    if (!m) return;
    const value = parseFloat(m[1].replace(',', '.'));
    let unit = m[2].toLowerCase();
    if (unit === 'gr') unit = 'g';
    const found = formats?.find((f) => f.value === value && f.unit === unit);
    if (found) form.setValue('format', found._id);
  };

  const toggleCollection = (id: string) =>
    setSelectedCollections((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));

  const handle = async (base: BaseValues) => {
    const main = presentations.find((p) => p.principal) ?? presentations[0];
    if (!main || main.unitPrice <= 0) {
      setPresError('La presentación principal necesita un precio mayor a 0.');
      scrollToSection('sec-presentaciones');
      return;
    }
    setPresError(null);

    const presentaciones = presentations.map((p) => ({
      type: p.type,
      quantity: p.type === 'unidad' ? 1 : p.quantity,
      unitPrice: p.unitPrice,
      tiers: p.tiers ?? [],
      fixedDiscount: p.fixedDiscount?.enabled ? p.fixedDiscount : undefined,
      label: p.label?.trim() || undefined,
      barcode: p.barcode?.trim() || undefined,
      principal: p.principal,
    }));

    const payload: CreateProductInput = {
      sku: base.sku?.trim() || undefined,
      name: base.name,
      description: base.description,
      categories: base.categories,
      brand: base.brand,
      format: base.format,
      flavors: base.flavors,
      barcode: base.barcode?.trim() || undefined,
      unitPrice: main.unitPrice,
      saleUnit: { type: main.type, quantity: main.type === 'unidad' ? 1 : main.quantity },
      tiers: main.tiers ?? [],
      fixedDiscount: main.fixedDiscount?.enabled ? main.fixedDiscount : undefined,
      presentaciones,
      featured: base.featured,
      active: base.active,
      attributes: base.attributes,
    };

    await onSubmit({ payload, images: images.map((i) => i.file), collectionIds: selectedCollections });
  };

  const errorCount = Object.keys(form.formState.errors).length + (presError ? 1 : 0);

  // ---- Bloques compartidos ----
  const previewCard = (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Eye className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-none">Vista previa</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">La card real del catálogo</p>
        </div>
      </div>
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="mx-auto max-w-[210px]">
          <ProductCardPreview
            name={watch.name}
            presentations={presentations}
            imagePreview={previewImage}
            brandName={brandName}
            formatLabel={formatLabel}
            flavorName={flavorNames}
          />
        </div>
      </div>
    </div>
  );

  const publishCard = (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold">Publicación</p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
          <div>
            <p className="text-[13px] font-medium">Activo</p>
            <p className="text-[11px] text-muted-foreground">Visible en el catálogo</p>
          </div>
          <Switch checked={!!watch.active} onCheckedChange={(c) => form.setValue('active', c)} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
          <div>
            <p className="text-[13px] font-medium">Destacado</p>
            <p className="text-[11px] text-muted-foreground">Aparece en el home</p>
          </div>
          <Switch checked={!!watch.featured} onCheckedChange={(c) => form.setValue('featured', c)} />
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Listo para publicar
          </p>
          <span className={cn(
            'text-[11px] font-bold tabular-nums',
            progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          )}>
            {progress}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              progress === 100 ? 'bg-emerald-500' : 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <ul className="mt-3 space-y-1.5">
          {checks.required.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-xs">
              {c.done ? (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              <span className={cn(c.done ? 'text-foreground' : 'text-muted-foreground')}>{c.label}</span>
            </li>
          ))}
          {checks.optional.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-xs">
              {c.done ? (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span className="text-muted-foreground">{c.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground/60">opcional</span>
            </li>
          ))}
        </ul>
      </div>

      <Button type="submit" form="product-form-v2" disabled={isSubmitting} className="mt-4 w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Crear producto
      </Button>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Atajo: <kbd className="rounded border bg-muted px-1 font-mono">Ctrl</kbd>+<kbd className="rounded border bg-muted px-1 font-mono">S</kbd>
      </p>
    </div>
  );

  return (
    <div className="pb-24 lg:pb-8">
      {/* ── Top command bar ── */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-6 border-b bg-background/85 px-4 py-3 backdrop-blur md:-mx-6 md:-mt-6 md:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Volver</span>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">
                {watch.name?.trim() || 'Nuevo producto'}
              </h1>
              <span className="hidden shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary sm:inline-flex">
                <Sparkles className="h-2.5 w-2.5" />
                v2
              </span>
            </div>
            <p className="hidden text-[11px] text-muted-foreground md:block">
              Productos / Nuevo · el SKU se genera automáticamente
            </p>
          </div>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            {errorCount > 0 ? (
              <span className="text-xs font-semibold text-destructive">
                {errorCount} error{errorCount > 1 && 'es'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                {presentations.length} presentación{presentations.length > 1 && 'es'}
              </span>
            )}
            <div className="h-5 w-px bg-border" />
            <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" form="product-form-v2" size="sm" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </div>
      </div>

      <form id="product-form-v2" ref={formRef} onSubmit={form.handleSubmit(handle)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[190px_minmax(0,1fr)_330px]">
          {/* ── Rail izquierdo: nav de secciones (xl+) ── */}
          <nav className="hidden xl:block">
            <div className="sticky top-[76px] space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all',
                      active
                        ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0] shadow-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}

              <div className="mt-4 rounded-xl border border-dashed p-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Completitud</span>
                  <span className="font-bold tabular-nums">{progress}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-emerald-500' : 'bg-primary')}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </nav>

          {/* ── Centro: secciones ── */}
          <div className="min-w-0 space-y-8">
            {/* 1 · Información básica */}
            <section id="sec-basico" className="scroll-mt-24">
              <SectionHeader n={1} icon={FileText} title="Información básica" hint="Nombre visible, descripción e identificadores" />
              <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm md:p-5">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label htmlFor="name" className="text-sm font-semibold">Nombre *</Label>
                    {nameHasFormat && !watch.format && (
                      <Button type="button" size="sm" variant="ghost" onClick={suggestFormat} className="h-6 text-xs text-primary">
                        <Sparkles className="mr-1 h-3 w-3" />Detectar formato del nombre
                      </Button>
                    )}
                  </div>
                  <Input id="name" {...form.register('name')} placeholder="Ej: Galleta Triton chocolate 126g" className="h-11 text-base" />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-semibold">Descripción *</Label>
                  <Textarea id="description" {...form.register('description')} rows={2} placeholder="Descripción visible al cliente" />
                  {form.formState.errors.description && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.description.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label htmlFor="sku" className="flex items-center gap-1 text-xs"><Hash className="h-3 w-3" />SKU</Label>
                    <Input id="sku" {...form.register('sku')} placeholder="Auto: QU-XXXXXX" className="font-mono uppercase" />
                    <p className="mt-1 text-[11px] text-muted-foreground">Vacío = se genera solo. O ingresa uno para sincronizar con el Excel.</p>
                  </div>
                  <div>
                    <Label htmlFor="barcode" className="flex items-center gap-1 text-xs"><ScanLine className="h-3 w-3" />Código de barras</Label>
                    <Input id="barcode" {...form.register('barcode')} placeholder="7802408003446" inputMode="numeric" className="font-mono" />
                    <p className="mt-1 text-[11px] text-muted-foreground">EAN del producto. Cada presentación puede tener el suyo.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2 · Clasificación */}
            <section id="sec-clasificacion" className="scroll-mt-24">
              <SectionHeader n={2} icon={Tag} title="Clasificación" hint="Dónde aparece y cómo se filtra en el catálogo" />
              <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm md:p-5">
                <CategoryWithSubcategorySelector
                  selectedIds={watch.categories || []}
                  onChange={(ids) => form.setValue('categories', ids, { shouldValidate: true })}
                  disabled={isSubmitting}
                />
                {form.formState.errors.categories && (
                  <p className="text-xs text-destructive">{form.formState.errors.categories.message}</p>
                )}
                <BrandSelector selectedId={watch.brand} onChange={(id) => form.setValue('brand', id)} disabled={isSubmitting} />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormatPicker value={watch.format} onChange={(id) => form.setValue('format', id)} disabled={isSubmitting} />
                  <FlavorMultiPicker values={watch.flavors || []} onChange={(ids) => form.setValue('flavors', ids)} disabled={isSubmitting} />
                </div>
              </div>
            </section>

            {/* 3 · Atributos dinámicos */}
            {hasAttributes && (
              <section id="sec-atributos" className="scroll-mt-24">
                <SectionHeader n={3} icon={Settings2} title="Atributos" hint="Definidos por las categorías elegidas" />
                <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm md:p-5">
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
                                  onClick={() => setValues(active ? current.filter((v) => v !== opt.value) : [...current, opt.value])}
                                  className={cn(
                                    'rounded-full border px-3 py-1 text-xs transition-all',
                                    active
                                      ? 'border-primary bg-primary/10 font-medium text-primary'
                                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                  )}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <Select value={current[0] || ''} onValueChange={(v) => setValues(v ? [v] : [])} disabled={isSubmitting}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder={`Seleccionar ${attr.label}`} /></SelectTrigger>
                            <SelectContent>
                              {attr.options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4 · Presentaciones y precios */}
            <section id="sec-presentaciones" className="scroll-mt-24">
              <SectionHeader
                n={hasAttributes ? 4 : 3}
                icon={Coins}
                title="Presentaciones y precios"
                hint="Cada forma de venta con su precio, oferta y tramos. Una es la principal."
                accent
              />
              <UnifiedPresentationsEditor value={presentations} onChange={setPresentations} disabled={isSubmitting} />
              {presError && <p className="mt-2 text-xs font-medium text-destructive">{presError}</p>}
            </section>

            {/* 5 · Imágenes */}
            <section id="sec-imagenes" className="scroll-mt-24">
              <SectionHeader n={hasAttributes ? 5 : 4} icon={ImageIcon} title="Imágenes" hint="Máx. 5 — la primera es la portada del catálogo" />
              <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
                <ImageUploaderWithPreview images={images} onChange={setImages} maxImages={5} disabled={isSubmitting} />
              </div>
            </section>

            {/* 6 · Colecciones */}
            <section id="sec-colecciones" className="scroll-mt-24">
              <SectionHeader n={hasAttributes ? 6 : 5} icon={FolderHeart} title="Colecciones" hint="Packs y agrupaciones donde aparece (opcional)" />
              <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
                {!collections || collections.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay colecciones creadas.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {collections.map((c) => {
                      const active = selectedCollections.includes(c._id);
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => toggleCollection(c._id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
                            active
                              ? 'border-primary bg-primary/10 font-medium text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          )}
                        >
                          {c.emoji && <span>{c.emoji}</span>}
                          {c.name}
                          {active && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Derecha: preview + publicación (lg+) ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[76px] space-y-4">
              {previewCard}
              {publishCard}
            </div>
          </aside>

          {/* En mobile, preview + publicación al final del flujo */}
          <div className="space-y-4 lg:hidden">
            {publishCard}
          </div>
        </div>

        {/* Preview móvil (sheet flotante) */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="fixed bottom-20 right-4 z-30 rounded-full border shadow-lg">
                <Eye className="mr-2 h-4 w-4" />Vista previa
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto p-4 pt-10">
              <SheetTitle className="sr-only">Vista previa del cliente</SheetTitle>
              {previewCard}
            </SheetContent>
          </Sheet>
        </div>

        {/* Barra inferior (solo mobile) */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 shadow-lg backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="text-xs text-muted-foreground">
              {errorCount > 0 ? (
                <span className="font-semibold text-destructive">⚠ {errorCount} error(es)</span>
              ) : (
                <span className="tabular-nums">{progress}% listo</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Crear
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function SectionHeader({
  n, icon: Icon, title, hint, accent,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm font-bold',
          accent
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-border bg-muted/50 text-muted-foreground'
        )}
      >
        {n}
      </span>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold leading-tight">
          <Icon className={cn('h-4 w-4', accent ? 'text-primary' : 'text-muted-foreground')} />
          {title}
        </h2>
        <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

export default ProductFormV2;
