'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, X, ImagePlus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { getSafeImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import { ProductPicker } from './ProductPicker';
import type { Collection, ProductParent } from '@/types';

const GRADIENT_PRESETS = [
  { label: 'Turquesa Quelita', value: 'from-primary to-secondary' },
  { label: 'Rosa cumpleaños', value: 'from-pink-400 to-rose-500' },
  { label: 'Naranja cinéfilo', value: 'from-amber-400 to-orange-600' },
  { label: 'Azul oficina', value: 'from-blue-400 to-cyan-500' },
  { label: 'Púrpura nocturno', value: 'from-indigo-500 to-purple-600' },
  { label: 'Verde sin culpa', value: 'from-green-400 to-emerald-500' },
  { label: 'Rojo fiesta', value: 'from-red-400 to-pink-500' },
  { label: 'Amarillo dorado', value: 'from-yellow-400 to-amber-500' },
];

const collectionFormSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
  emoji: z.string().max(8).optional().or(z.literal('')),
  gradient: z.string().max(120).optional().or(z.literal('')),
  active: z.boolean().optional(),
  showOnHome: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof collectionFormSchema>;

interface CollectionFormProps {
  collection?: Collection;
  onSubmit: (data: FormValues & { products: string[] }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  /** Subir imagen a Cloudinary — solo disponible cuando hay collection (edición) */
  onUploadImage?: (id: string, file: File) => void;
  isUploadingImage?: boolean;
}

export function CollectionForm({
  collection,
  onSubmit,
  onCancel,
  isSubmitting = false,
  onUploadImage,
  isUploadingImage = false,
}: CollectionFormProps) {
  const isEditing = !!collection;
  const [imagePreview, setImagePreview] = useState<string | null>(
    collection?.image || null
  );

  // IDs en orden curado — fuente de verdad de los productos seleccionados
  const initialProductIds = useMemo(() => {
    if (!collection?.products) return [];
    return Array.isArray(collection.products)
      ? collection.products.map((p) =>
          typeof p === 'string' ? p : (p as ProductParent)._id
        )
      : [];
  }, [collection]);

  const [productIds, setProductIds] = useState<string[]>(initialProductIds);
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: collection?.name || '',
      description: collection?.description || '',
      image: collection?.image || '',
      emoji: collection?.emoji || '',
      gradient: collection?.gradient || GRADIENT_PRESETS[0].value,
      active: collection?.active ?? true,
      showOnHome: collection?.showOnHome ?? true,
      order: collection?.order ?? 0,
    },
  });

  useEffect(() => {
    if (collection) {
      form.reset({
        name: collection.name || '',
        description: collection.description || '',
        image: collection.image || '',
        emoji: collection.emoji || '',
        gradient: collection.gradient || GRADIENT_PRESETS[0].value,
        active: collection.active ?? true,
        showOnHome: collection.showOnHome ?? true,
        order: collection.order ?? 0,
      });
      setProductIds(initialProductIds);
      setImagePreview(collection.image || null);
    }
  }, [collection, initialProductIds, form]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !collection || !onUploadImage) return;

    // Preview inmediata
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Subir a Cloudinary
    onUploadImage(collection._id, file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    // Marca explícita: la próxima submit envía image: '' al backend
    form.setValue('image', '__REMOVE__');
  };

  // Resolver datos de los productos seleccionados (para mostrar tarjetas)
  const { data: pickedProducts } = useQuery({
    queryKey: ['admin-collection-picked-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [] as ProductParent[];
      // Trae todos los productos de un saque y reordena en cliente
      const { data } = await api.get(
        `/products/parents?limit=${productIds.length}&active=all`
      );
      const all = (data.data?.data || []) as ProductParent[];
      // Filtrar y reordenar en orden curado
      const map = new Map(all.map((p) => [p._id, p]));
      return productIds
        .map((id) => map.get(id))
        .filter(Boolean) as ProductParent[];
    },
    enabled: productIds.length > 0,
  });

  const handleSubmit = (values: FormValues) => {
    // Convertir el sentinel __REMOVE__ a string vacío explícito (clear image)
    const cleaned = {
      ...values,
      image: values.image === '__REMOVE__' ? '' : values.image,
    };
    onSubmit({ ...cleaned, products: productIds });
  };

  const togglePicked = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removePicked = (id: string) => {
    setProductIds((prev) => prev.filter((x) => x !== id));
  };

  const movePicked = (fromIdx: number, toIdx: number) => {
    setProductIds((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  };

  const watchedGradient = form.watch('gradient');
  const watchedEmoji = form.watch('emoji');

  return (
    <div className="space-y-6">
      {/* Vista previa */}
      <div className="rounded-2xl border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vista previa de la tarjeta
        </p>
        <div
          className={cn(
            'relative h-32 w-48 overflow-hidden rounded-2xl bg-gradient-to-br shadow-md',
            watchedGradient || 'from-primary to-secondary'
          )}
        >
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-5xl drop-shadow-lg" aria-hidden>
              {watchedEmoji || '🎀'}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2 text-white">
            <p className="line-clamp-1 text-xs font-bold">
              {form.watch('name') || 'Nombre de la colección'}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: Combo Cumpleaños"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  El slug se genera automáticamente desde el nombre
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Frase corta que aparecerá debajo del nombre"
                    rows={2}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="🎂"
                      maxLength={8}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Aparece como decoración cuando no hay imagen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                        )
                      }
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Menor = aparece primero
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Gradient picker */}
          <FormField
            control={form.control}
            name="gradient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gradiente</FormLabel>
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => field.onChange(g.value)}
                      className={cn(
                        'relative h-12 overflow-hidden rounded-lg bg-gradient-to-br ring-2 transition-all hover:scale-105',
                        g.value,
                        field.value === g.value
                          ? 'ring-primary ring-offset-2'
                          : 'ring-transparent'
                      )}
                      title={g.label}
                      aria-label={g.label}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Imagen — uploader Cloudinary (solo en edición; al crear, primero se guarda) */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Imagen de la colección</p>
                <p className="text-[11px] text-muted-foreground">
                  Recomendado 600×360 (formato 5:3). Si no hay imagen, se usa el emoji + gradiente.
                </p>
              </div>
            </div>

            {!isEditing ? (
              <div className="rounded-md bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                Guardá primero la colección y volvé a editarla para subir una imagen.
              </div>
            ) : (
              <div className="flex items-start gap-4">
                {/* Preview en formato landscape */}
                <div
                  className={cn(
                    'relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border bg-muted',
                    !imagePreview && 'bg-gradient-to-br',
                    !imagePreview && (watchedGradient || 'from-primary to-secondary')
                  )}
                >
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="text-3xl drop-shadow" aria-hidden>
                        {watchedEmoji || '🎀'}
                      </span>
                    </div>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-2">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={isUploadingImage}
                      className="hidden"
                      id="collection-image-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={isUploadingImage}
                    >
                      <label
                        htmlFor="collection-image-input"
                        className="cursor-pointer"
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {imagePreview ? 'Reemplazar' : 'Subir imagen'}
                      </label>
                    </Button>
                  </label>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Quitar
                    </Button>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG o WEBP. Se redimensiona y optimiza automáticamente.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Productos curados</p>
                <p className="text-xs text-muted-foreground">
                  {productIds.length}{' '}
                  {productIds.length === 1 ? 'producto' : 'productos'} en orden
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar / quitar
              </Button>
            </div>

            {productIds.length > 0 && (
              <ScrollArea className="max-h-64 -mx-2 px-2">
                <ul className="space-y-1.5 py-2">
                  {productIds.map((id, idx) => {
                    const p = pickedProducts?.find((x) => x._id === id);
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-2 rounded-lg border bg-card p-2"
                      >
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => idx > 0 && movePicked(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Subir"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              idx < productIds.length - 1 &&
                              movePicked(idx, idx + 1)
                            }
                            disabled={idx === productIds.length - 1}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Bajar"
                          >
                            ▼
                          </button>
                        </div>
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold tabular-nums">
                          {idx + 1}
                        </span>
                        {p?.images?.[0] && (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={getSafeImageUrl(p.images[0], {
                                width: 80,
                                height: 80,
                              })}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="line-clamp-1 flex-1 text-sm">
                          {p?.name || (
                            <span className="text-muted-foreground italic">
                              cargando...
                            </span>
                          )}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removePicked(id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          aria-label="Quitar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>

          {/* Toggles */}
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Activa</FormLabel>
                    <FormDescription className="text-[11px]">
                      Si está inactiva, no se muestra en home ni catálogo
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showOnHome"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Mostrar en home</FormLabel>
                    <FormDescription className="text-[11px]">
                      Aparece en la sección "Colecciones" de la home /m
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>{isEditing ? 'Actualizar colección' : 'Crear colección'}</>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedIds={productIds}
        onToggle={togglePicked}
      />
    </div>
  );
}
