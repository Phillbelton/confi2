'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSafeImageUrl } from '@/lib/image-utils';
import { DimensionHint, specForPlacement } from '@/components/admin/banners/DimensionHint';
import { useCategoriesFlat } from '@/hooks/useCategories';
import { api } from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type {
  Banner,
  BannerPlacement,
  BannerSize,
  BannerLinkType,
  Collection,
  Category,
  Product,
} from '@/types';

const PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: 'home_hero', label: 'Home — Hero (banner principal)' },
  { value: 'home_promo', label: 'Home — Promociones (sección final)' },
  { value: 'home_secondary', label: 'Home — Secundario' },
  { value: 'category_top', label: 'Top de categoría' },
  { value: 'collection_top', label: 'Top de colección' },
];

const LINK_TYPES: { value: BannerLinkType; label: string }[] = [
  { value: 'none', label: 'Sin link (decorativo)' },
  { value: 'collection', label: 'Colección' },
  { value: 'category', label: 'Categoría' },
  { value: 'product', label: 'Producto' },
  { value: 'external', label: 'URL externa' },
];

const formSchema = z.object({
  placement: z.string(),
  order: z.number().int().min(0),
  size: z.string(),
  title: z.string().max(120).optional().or(z.literal('')),
  subtitle: z.string().max(200).optional().or(z.literal('')),
  ctaText: z.string().max(40).optional().or(z.literal('')),
  linkType: z.string(),
  linkTarget: z.string().optional().or(z.literal('')),
  active: z.boolean().optional(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

// Forma del payload que emitimos hacia onSubmit (no es FormValues directo:
// reagrupamos linkType + linkTarget en `link: { type, target }` antes
// de salir; ver handleSubmit más abajo).
export interface BannerFormSubmitData {
  placement: BannerPlacement;
  order: number;
  size: BannerSize;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  link: { type: BannerLinkType; target?: string };
  active?: boolean;
  startDate?: string;
  endDate?: string;
}

interface BannerFormProps {
  banner?: Banner;
  /** Placement inicial al crear (preseleccionado desde el editor de franjas). */
  defaultPlacement?: BannerPlacement;
  /** Columnas de la franja (para el tamaño ideal en home_promo/secondary). */
  cols?: number;
  onSubmit: (data: BannerFormSubmitData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  onUploadImage?: (id: string, file: File, variant: 'main' | 'mobile') => void;
  isUploadingImage?: boolean;
}

export function BannerForm({
  banner,
  defaultPlacement,
  cols,
  onSubmit,
  onCancel,
  isSubmitting = false,
  onUploadImage,
  isUploadingImage = false,
}: BannerFormProps) {
  const isEditing = !!banner;
  const [imagePreview, setImagePreview] = useState<string | null>(
    banner?.image ? getSafeImageUrl(banner.image) : null
  );
  const [imageMobilePreview, setImageMobilePreview] = useState<string | null>(
    banner?.imageMobile ? getSafeImageUrl(banner.imageMobile) : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      placement: banner?.placement || defaultPlacement || 'home_promo',
      order: banner?.order ?? 0,
      size: banner?.size || 'normal',
      title: banner?.title || '',
      subtitle: banner?.subtitle || '',
      ctaText: banner?.ctaText || 'Ver más',
      linkType: banner?.link?.type || 'none',
      linkTarget: banner?.link?.target || '',
      active: banner?.active ?? true,
      startDate: banner?.startDate ? banner.startDate.slice(0, 10) : '',
      endDate: banner?.endDate ? banner.endDate.slice(0, 10) : '',
    },
  });

  // Resync de previews desde props NO se necesita: el callsite (edit page)
  // monta el form sólo cuando `banner` ya está cargado, y new-page monta sin
  // banner. State inicializa lazy desde props arriba (líneas 101-106).

  const handleImageSelect =
    (variant: 'main' | 'mobile') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !banner || !onUploadImage) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (variant === 'main') setImagePreview(reader.result as string);
        else setImageMobilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onUploadImage(banner._id, file, variant);
    };

  const watchedLinkType = useWatch({ control: form.control, name: 'linkType' }) as BannerLinkType;
  const watchedPlacement = useWatch({ control: form.control, name: 'placement' }) as BannerPlacement;

  // Tamaño ideal de la imagen según el placement (y columnas si es franja).
  const imageSpec = specForPlacement(watchedPlacement, cols ?? banner?.cols);

  // Loaders para los pickers
  const { data: categoriesRaw } = useCategoriesFlat();
  const categories: Category[] = categoriesRaw || [];

  const { data: collectionsData } = useQuery({
    queryKey: ['admin-collections-for-banner-picker'],
    queryFn: async () => {
      const { data } = await api.get('/collections?active=true');
      return (data.data?.collections || []) as Collection[];
    },
    enabled: watchedLinkType === 'collection',
  });
  const collections = collectionsData || [];

  // Product picker simplificado: input de slug + buscador rápido
  const [productSearch, setProductSearch] = useState('');
  const { data: productSearchData } = useQuery({
    queryKey: ['admin-products-banner-search', productSearch],
    queryFn: async () => {
      if (!productSearch || productSearch.length < 2) return [] as Product[];
      const { data } = await api.get(
        `/products?search=${encodeURIComponent(productSearch)}&limit=10&active=all`
      );
      return (data.data?.data || []) as Product[];
    },
    enabled: watchedLinkType === 'product' && productSearch.length >= 2,
  });

  const handleSubmit = (values: FormValues) => {
    // values.placement/size/linkType vienen del Select y zod los valida
    // como string; en runtime sólo pueden ser los literales soportados.
    const payload: BannerFormSubmitData = {
      placement: values.placement as BannerPlacement,
      order: values.order,
      size: values.size as BannerSize,
      title: values.title || undefined,
      subtitle: values.subtitle || undefined,
      ctaText: values.ctaText || undefined,
      link: {
        type: values.linkType as BannerLinkType,
        target: values.linkTarget || undefined,
      },
      active: values.active ?? true,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    };
    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {/* IMAGEN */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-semibold">Imagen principal</p>
              <DimensionHint spec={imageSpec} />
            </div>
            <div className="flex items-start gap-3">
              <div className="relative h-32 w-56 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {imagePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-3xl text-muted-foreground/40">
                    🖼️
                  </div>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 grid place-items-center bg-black/40">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label>
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {imagePreview ? 'Reemplazar' : 'Subir imagen'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect('main')}
                    className="hidden"
                    disabled={!isEditing || isUploadingImage}
                  />
                </label>
                {!isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Guardá primero el banner para subir imagen.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">
              Imagen mobile (opcional, override)
            </p>
            <div className="flex items-start gap-3">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {imageMobilePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageMobilePreview}
                    alt="preview mobile"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-3xl text-muted-foreground/40">
                    📱
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <ImagePlus className="mr-1 h-4 w-4" />
                      {imageMobilePreview ? 'Reemplazar' : 'Subir'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect('mobile')}
                    className="hidden"
                    disabled={!isEditing || isUploadingImage}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Si el banner ancho no se ve bien en mobile portrait, subí una versión adaptada (ej. 800×600).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PLACEMENT */}
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="placement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placement</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Dónde se muestra. El tamaño y la posición de los banners de
                  Promociones/Secundario se ajustan en la pestaña “Plantilla de home”.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* TEXTOS */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Halloween Mix" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtítulo / etiqueta</FormLabel>
                <FormControl>
                  <Input placeholder="Especial Halloween" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ctaText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto del botón (CTA)</FormLabel>
              <FormControl>
                <Input placeholder="Ver colección" {...field} />
              </FormControl>
              <FormDescription>
                Si está vacío y hay link, no se muestra el botón
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LINK ESTRUCTURADO */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Acción al hacer click</p>

          <FormField
            control={form.control}
            name="linkType"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue('linkTarget', '');
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LINK_TYPES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedLinkType === 'collection' && (
            <FormField
              control={form.control}
              name="linkTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colección</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegí una colección" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {collections.map((c) => (
                        <SelectItem key={c._id} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchedLinkType === 'category' && (
            <FormField
              control={form.control}
              name="linkTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegí una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c._id} value={c.slug}>
                          {!c.parent ? c.name : `↳ ${c.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchedLinkType === 'product' && (
            <FormField
              control={form.control}
              name="linkTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Input
                    placeholder="Buscar producto por nombre…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {productSearchData && productSearchData.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-background">
                      {productSearchData.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            field.onChange(p.slug);
                            setProductSearch(p.name);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm hover:bg-muted',
                            field.value === p.slug && 'bg-primary/10 font-semibold'
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {field.value && (
                    <p className="text-xs text-muted-foreground">
                      Seleccionado: <code className="text-primary">{field.value}</code>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchedLinkType === 'external' && (
            <FormField
              control={form.control}
              name="linkTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL externa</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.ejemplo.cl/promo" {...field} />
                  </FormControl>
                  <FormDescription>Abre en nueva pestaña</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* SCHEDULE + ACTIVE */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mostrar desde</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Opcional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hasta</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Se oculta solo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Activo</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Visible al público</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar cambios' : 'Crear banner'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
