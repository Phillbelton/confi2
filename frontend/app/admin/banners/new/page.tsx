'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BannerForm, type BannerFormSubmitData } from '@/components/admin/banners/BannerForm';
import { useBannerOperations } from '@/hooks/admin/useAdminBanners';
import type { BannerPlacement, BannerCols, BannerMobileMode } from '@/types';

function NewBannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createAsync, isCreating } = useBannerOperations();

  // Preset de franja cuando se entra desde el editor de plantilla.
  const presetPlacement = searchParams.get('placement') as BannerPlacement | null;
  const presetRowOrder = searchParams.get('rowOrder');
  const presetCols = searchParams.get('cols');
  const presetMobileMode = searchParams.get('mobileMode') as BannerMobileMode | null;

  const handleSubmit = async (payload: BannerFormSubmitData) => {
    // image: '/placeholder-product.svg' inicial. El admin sube la real en la
    // página de edit donde el endpoint /banners/:id/image requiere id válido.
    const withPlaceholder = {
      ...payload,
      image: '/placeholder-product.svg',
      ...(presetRowOrder !== null && { rowOrder: Number(presetRowOrder) }),
      ...(presetCols !== null && { cols: Number(presetCols) as BannerCols }),
      ...(presetMobileMode !== null && { mobileMode: presetMobileMode }),
    };
    try {
      const created = await createAsync(withPlaceholder);
      // Redirigir a la página de edición para subir la imagen real.
      router.push(`/admin/banners/${created._id}`);
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
            isSubmitting={isCreating}
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
