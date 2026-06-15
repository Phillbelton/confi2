'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BannerForm,
  type BannerFormSubmitData,
  type BannerPendingImages,
} from '@/components/admin/banners/BannerForm';
import { useBannerOperations } from '@/hooks/admin/useAdminBanners';
import type { BannerPlacement, BannerCols, BannerMobileMode } from '@/types';

function NewBannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createAsync, isCreating, uploadImageAsync, isUploadingImage } =
    useBannerOperations();

  // Preset de franja cuando se entra desde el editor de plantilla.
  const presetPlacement = searchParams.get('placement') as BannerPlacement | null;
  const presetRowOrder = searchParams.get('rowOrder');
  const presetCols = searchParams.get('cols');
  const presetMobileMode = searchParams.get('mobileMode') as BannerMobileMode | null;

  const handleSubmit = async (
    payload: BannerFormSubmitData,
    images: BannerPendingImages
  ) => {
    // El endpoint de imagen exige un id, así que el alta es create + upload.
    // Sin imagen elegida el banner nace INACTIVO: jamás un placeholder
    // visible en la tienda (defensa extra: el público también los filtra).
    const withPlaceholder = {
      ...payload,
      image: '/placeholder-product.svg',
      active: images.main ? payload.active : false,
      ...(presetRowOrder !== null && { rowOrder: Number(presetRowOrder) }),
      ...(presetCols !== null && { cols: Number(presetCols) as BannerCols }),
      ...(presetMobileMode !== null && { mobileMode: presetMobileMode }),
    };
    try {
      const created = await createAsync(withPlaceholder);
      if (!images.main) {
        toast.info('Banner creado inactivo', {
          description: 'Subí una imagen desde su edición y activalo.',
        });
        router.push(`/admin/banners/${created._id}`);
        return;
      }
      try {
        await uploadImageAsync({ id: created._id, file: images.main, variant: 'main' });
        if (images.mobile) {
          await uploadImageAsync({ id: created._id, file: images.mobile, variant: 'mobile' });
        }
        router.push('/admin/banners');
      } catch {
        // El banner existe pero quedó sin imagen: a su edición a reintentar.
        toast.warning('El banner se creó, pero falló la subida de la imagen. Reintentá desde acá.');
        router.push(`/admin/banners/${created._id}`);
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/banners')}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver
      </Button>

      <div>
        <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold tracking-tight">
          <span aria-hidden>🎁</span>
          Nuevo banner
        </h1>
        <p className="text-muted-foreground">
          Definí los datos. Después de guardar vas a poder subir la imagen.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <BannerForm
            defaultPlacement={presetPlacement || undefined}
            cols={presetCols !== null ? Number(presetCols) : undefined}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/banners')}
            isSubmitting={isCreating || isUploadingImage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewBannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewBannerContent />
    </Suspense>
  );
}
