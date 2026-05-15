'use client';

import { useState } from 'react';
import { Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BannersTable } from '@/components/admin/banners/BannersTable';
import { BannerForm } from '@/components/admin/banners/BannerForm';
import {
  useAdminBanners,
  useBannerOperations,
} from '@/hooks/admin/useAdminBanners';
import type { Banner, BannerPlacement } from '@/types';

const PLACEMENT_OPTIONS: { value: BannerPlacement | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los placements' },
  { value: 'home_hero', label: 'Home — Hero' },
  { value: 'home_promo', label: 'Home — Promociones' },
  { value: 'home_secondary', label: 'Home — Secundario' },
  { value: 'category_top', label: 'Top de categoría' },
  { value: 'collection_top', label: 'Top de colección' },
];

export default function BannersAdminPage() {
  const [placementFilter, setPlacementFilter] = useState<BannerPlacement | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Banner | undefined>(undefined);

  const { data: banners = [], isLoading, error } = useAdminBanners(
    placementFilter === 'all' ? undefined : placementFilter
  );

  const {
    create,
    createAsync,
    update,
    remove,
    uploadImage,
    isCreating,
    isUpdating,
    isRemoving,
    isUploadingImage,
  } = useBannerOperations();

  const handleOpenDialog = (banner?: Banner) => {
    setSelected(banner);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelected(undefined);
  };

  const handleSubmit = async (payload: any) => {
    if (selected) {
      update(
        { id: selected._id, payload },
        { onSuccess: handleCloseDialog }
      );
    } else {
      // Para create, necesitamos un image placeholder (el endpoint require image)
      // Solución: crear con image: '/placeholder-product.svg', después admin sube real
      const withPlaceholder = { ...payload, image: '/placeholder-product.svg' };
      try {
        await createAsync(withPlaceholder);
        // No cerrar el dialog — permitir subir imagen ahora
        // El cliente debe re-abrir el dialog del banner recién creado
        handleCloseDialog();
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold tracking-tight">
            <span aria-hidden>🎁</span>
            Banners y promociones
          </h1>
          <p className="text-muted-foreground">
            Heroes, banners y secciones promocionales del storefront
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo banner
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filtrar:</span>
        <Select
          value={placementFilter}
          onValueChange={(v) => setPlacementFilter(v as any)}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLACEMENT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Cargando banners...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-destructive mb-4" />
            <p className="text-sm text-muted-foreground">Error al cargar banners</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <BannersTable
          banners={banners}
          onEdit={handleOpenDialog}
          onDelete={(id) => remove(id)}
          isDeleting={isRemoving}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected ? 'Editar banner' : 'Nuevo banner'}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? 'Modificá los datos. Los cambios se reflejan en el storefront automáticamente.'
                : 'Creá el banner con sus datos. Después de guardar, podés subir la imagen.'}
            </DialogDescription>
          </DialogHeader>
          <BannerForm
            banner={selected}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={isCreating || isUpdating}
            onUploadImage={(id, file, variant) =>
              uploadImage({ id, file, variant })
            }
            isUploadingImage={isUploadingImage}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
