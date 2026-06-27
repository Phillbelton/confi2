'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2, Upload, X, Info, Plus, Trash2, ChevronDown, ChevronRight,
  CornerDownRight, FolderTree,
} from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Category, FacetableAttribute } from '@/types';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  parent: z.string().optional(),
  icon: z.string().max(50, 'El icono no puede exceder 50 caracteres').optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hex inválido')
    .optional(),
  order: z.number().int().min(0, 'El orden no puede ser negativo').optional(),
  active: z.boolean().optional(),
  facetableAttributes: z
    .array(
      z.object({
        key: z.string().min(1).max(60),
        label: z.string().min(1).max(80),
        options: z.array(
          z.object({
            value: z.string().min(1).max(60),
            label: z.string().min(1).max(80),
          })
        ),
        multiSelect: z.boolean(),
        order: z.number().int().min(0),
      })
    )
    .optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  /** Pre-selecciona un padre cuando se crea desde el botón "+ Subcategoría". */
  defaultParentId?: string;
  onSubmit: (data: CategoryFormValues) => void;
  onUploadImage?: (categoryId: string, file: File) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isUploadingImage?: boolean;
}

export function CategoryForm({
  category,
  categories,
  defaultParentId,
  onSubmit,
  onUploadImage,
  onCancel,
  isSubmitting = false,
  isUploadingImage = false,
}: CategoryFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    category?.image || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isEditing = !!category;

  // Resolver el padre (fijo, no editable). Al editar viene de la categoría;
  // al crear una subcategoría viene de defaultParentId.
  const parentId =
    (typeof category?.parent === 'string'
      ? category.parent
      : category?.parent?._id) || defaultParentId || '';
  const parentCategory = parentId
    ? categories.find((c) => c._id === parentId)
    : undefined;
  const isSubcategory = !!parentId;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      parent: typeof category?.parent === 'string'
        ? category.parent
        : category?.parent?._id || defaultParentId || '',
      icon: category?.icon || '',
      color: category?.color || '#F97316',
      order: category?.order || 0,
      active: category?.active ?? true,
      facetableAttributes: category?.facetableAttributes || [],
    },
  });

  // Subscripciones aisladas para Preview del avatar y el editor de facetas.
  const watchedColor = useWatch({ control: form.control, name: 'color' });
  const watchedIcon = useWatch({ control: form.control, name: 'icon' });
  const watchedName = useWatch({ control: form.control, name: 'name' });
  const watchedFacets = useWatch({ control: form.control, name: 'facetableAttributes' });

  // No useEffect para resincronizar form/preview desde props: el callsite
  // monta CategoryForm con key={category?._id ?? `new:${defaultParentId}`},
  // así que el componente se re-monta cuando cambia el target → state y
  // defaultValues se inicializan lazy desde props arriba.

  const handleSubmit = (values: CategoryFormValues) => {
    // Clean up empty strings y limpieza defensiva de atributos vacíos
    const cleanedAttrs = (values.facetableAttributes || [])
      .filter((a) => a.key && a.label)
      .map((a) => ({
        ...a,
        options: (a.options || []).filter((o) => o.value && o.label),
      }));
    const cleanedValues = {
      ...values,
      // `parent` se fija acá (no es editable). El backend lo ignora al
      // actualizar; solo lo usa al crear una subcategoría.
      parent: parentId || undefined,
      icon: values.icon || undefined,
      description: values.description || undefined,
      facetableAttributes: cleanedAttrs,
    };
    onSubmit(cleanedValues);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = () => {
    if (selectedFile && category && onUploadImage) {
      onUploadImage(category._id, selectedFile);
      setSelectedFile(null);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Image Upload Section - Only show for editing */}
      {isEditing && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Imagen de la categoría</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Imagen representativa de la categoría. Se muestra en banners y listados. Tamaños recomendados: mínimo 400x400px. Formatos: JPG, PNG, WEBP.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {imagePreview ? (
                <AvatarImage src={imagePreview} alt={category?.name} />
              ) : (
                <AvatarFallback
                  style={{
                    backgroundColor: watchedColor || '#F97316',
                    color: '#fff',
                  }}
                >
                  {watchedIcon || watchedName?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isUploadingImage}
                  className="flex-1"
                />
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveImage}
                    disabled={isUploadingImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <Button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={isUploadingImage}
                  size="sm"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir imagen
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: Cosmética"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descripción de la categoría..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Máximo 500 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Parent context — solo lectura. El padre se fija al crear y no
              se puede cambiar editando (evita ciclos y jerarquías profundas). */}
          {isSubcategory ? (
            <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2 text-sm">
              <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Subcategoría de{' '}
                <strong>{parentCategory?.name || 'categoría raíz'}</strong>
              </span>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <FolderTree className="h-4 w-4 shrink-0" />
              <span>
                Categoría raíz. Para agregarle subcategorías usa el botón
                "+ Subcategoría" en la lista de categorías.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: 🧴"
                      disabled={isSubmitting}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormDescription>
                    Emoji o nombre de icono
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        {...field}
                        disabled={isSubmitting}
                        className="w-20 h-10"
                      />
                      <Input
                        {...field}
                        placeholder="#F97316"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Order */}
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Orden</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Número para ordenar categorías en menús y listados. Menor número = aparece más arriba. Ejemplo: orden 1 aparece antes que orden 2.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                      min={0}
                    />
                  </FormControl>
                  <FormDescription>
                    Orden de visualización
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activa</FormLabel>
                    <FormDescription>
                      Visible en el catálogo
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

          {/* Atributos facetables */}
          <FacetableAttributesEditor
            attributes={watchedFacets || []}
            onChange={(next) => form.setValue('facetableAttributes', next, { shouldDirty: true })}
            disabled={isSubmitting}
          />

          {/* Form Actions */}
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
                <>{isEditing ? 'Actualizar categoría' : 'Crear categoría'}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface FacetableAttributesEditorProps {
  attributes: FacetableAttribute[];
  onChange: (next: FacetableAttribute[]) => void;
  disabled?: boolean;
}

function FacetableAttributesEditor({
  attributes,
  onChange,
  disabled,
}: FacetableAttributesEditorProps) {
  const [open, setOpen] = useState(attributes.length > 0);

  const addAttribute = () => {
    onChange([
      ...attributes,
      {
        key: '',
        label: '',
        options: [],
        multiSelect: false,
        order: attributes.length,
      },
    ]);
  };

  const updateAttr = (idx: number, patch: Partial<FacetableAttribute>) => {
    const next = attributes.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onChange(next);
  };

  const removeAttr = (idx: number) => {
    onChange(attributes.filter((_, i) => i !== idx));
  };

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium"
        disabled={disabled}
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Atributos facetables ({attributes.length})
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">
              Atributos para filtrar productos (ej. "% Cacao"). Los productos
              de subcategorías heredan estos atributos automáticamente.
            </p>
          </TooltipContent>
        </Tooltip>
      </button>

      {open && (
        <div className="p-3 space-y-3 border-t">
          {attributes.map((attr, idx) => (
            <div key={idx} className="border rounded-md p-3 space-y-2 bg-muted/20">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Etiqueta</label>
                  <Input
                    value={attr.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateAttr(idx, {
                        label,
                        key: attr.key || slugify(label),
                      });
                    }}
                    placeholder="Ej: % Cacao"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Slug (key)</label>
                  <Input
                    value={attr.key}
                    onChange={(e) => updateAttr(idx, { key: slugify(e.target.value) })}
                    placeholder="ej: cacao_percent"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={attr.multiSelect}
                    onCheckedChange={(v) => updateAttr(idx, { multiSelect: v })}
                    disabled={disabled}
                  />
                  Multi-select
                </label>
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Orden</span>
                  <Input
                    type="number"
                    value={attr.order}
                    onChange={(e) =>
                      updateAttr(idx, { order: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 h-8"
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttr(idx)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Opciones */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Opciones</label>
                {(attr.options || []).map((opt, oIdx) => (
                  <div key={oIdx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        const newOpts = [...attr.options];
                        newOpts[oIdx] = {
                          ...opt,
                          label,
                          value: opt.value || slugify(label),
                        };
                        updateAttr(idx, { options: newOpts });
                      }}
                      placeholder="Etiqueta (ej: 70%)"
                      disabled={disabled}
                    />
                    <Input
                      value={opt.value}
                      onChange={(e) => {
                        const newOpts = [...attr.options];
                        newOpts[oIdx] = { ...opt, value: slugify(e.target.value) };
                        updateAttr(idx, { options: newOpts });
                      }}
                      placeholder="slug (ej: 70-percent)"
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newOpts = attr.options.filter((_, i) => i !== oIdx);
                        updateAttr(idx, { options: newOpts });
                      }}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateAttr(idx, {
                      options: [...(attr.options || []), { value: '', label: '' }],
                    })
                  }
                  disabled={disabled}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar opción
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttribute}
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar atributo
          </Button>
        </div>
      )}
    </div>
  );
}
