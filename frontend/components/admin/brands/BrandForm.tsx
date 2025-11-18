'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Brand } from '@/types';

const brandFormSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  active: z.boolean().optional(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

interface BrandFormProps {
  brand?: Brand;
  onSubmit: (data: BrandFormValues) => void;
  onUploadLogo?: (brandId: string, file: File) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isUploadingLogo?: boolean;
}

export function BrandForm({
  brand,
  onSubmit,
  onUploadLogo,
  onCancel,
  isSubmitting = false,
  isUploadingLogo = false,
}: BrandFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    brand?.logo || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isEditing = !!brand;

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: brand?.name || '',
      active: brand?.active ?? true,
    },
  });

  // Update form when brand changes
  useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name || '',
        active: brand.active ?? true,
      });
      setLogoPreview(brand.logo || null);
    }
  }, [brand, form]);

  const handleSubmit = (values: BrandFormValues) => {
    onSubmit(values);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = () => {
    if (selectedFile && brand && onUploadLogo) {
      onUploadLogo(brand._id, selectedFile);
      setSelectedFile(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload Section - Only show for editing */}
      {isEditing && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Logo de la marca</h3>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {logoPreview ? (
                <AvatarImage src={logoPreview} alt={brand?.name} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {form.watch('name')?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  disabled={isUploadingLogo}
                  className="flex-1"
                />
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveLogo}
                    disabled={isUploadingLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <Button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={isUploadingLogo}
                  size="sm"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir logo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Recomendado: imagen cuadrada con fondo transparente (PNG)
          </p>
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
                    placeholder="Ej: Nike, Adidas, Samsung..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  El nombre de la marca debe ser único
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Activa</FormLabel>
                  <FormDescription>
                    La marca aparecerá en el catálogo público
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
                <>{isEditing ? 'Actualizar marca' : 'Crear marca'}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
