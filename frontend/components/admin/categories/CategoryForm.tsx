'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, Info } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineHelp } from '@/components/ui/inline-help';
import type { Category } from '@/types';

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
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  onSubmit: (data: CategoryFormValues) => void;
  onUploadImage?: (categoryId: string, file: File) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isUploadingImage?: boolean;
}

export function CategoryForm({
  category,
  categories,
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

  // Filter out current category and its children from parent options
  const availableParents = categories.filter((cat) => {
    if (!isEditing) return !cat.parent; // For new categories, show only main categories
    return cat._id !== category._id && !cat.parent; // For editing, exclude self and show only main
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      parent: typeof category?.parent === 'string'
        ? category.parent
        : category?.parent?._id || '',
      icon: category?.icon || '',
      color: category?.color || '#F97316',
      order: category?.order || 0,
      active: category?.active ?? true,
    },
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || '',
        description: category.description || '',
        parent: typeof category.parent === 'string'
          ? category.parent
          : category.parent?._id || '',
        icon: category.icon || '',
        color: category.color || '#F97316',
        order: category.order || 0,
        active: category.active ?? true,
      });
      setImagePreview(category.image || null);
    }
  }, [category, form]);

  const handleSubmit = (values: CategoryFormValues) => {
    // Clean up empty strings
    const cleanedValues = {
      ...values,
      parent: values.parent || undefined,
      icon: values.icon || undefined,
      description: values.description || undefined,
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
                    backgroundColor: form.watch('color') || '#F97316',
                    color: '#fff',
                  }}
                >
                  {form.watch('icon') || form.watch('name')?.charAt(0).toUpperCase() || '?'}
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

          {/* Parent Category */}
          <FormField
            control={form.control}
            name="parent"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Categoría padre</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Categorías padre aparecen en el menú principal. Subcategorías se muestran cuando haces click en la padre. Ejemplo: "Alimentos" (padre) → "Snacks", "Bebidas" (subcategorías).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  value={field.value || 'none'}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin categoría padre (categoría principal)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      Sin categoría padre
                    </SelectItem>
                    {availableParents.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona una categoría padre para crear una subcategoría
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
