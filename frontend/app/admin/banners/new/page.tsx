'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BannerForm } from '@/components/admin/banners/BannerForm';
import { useBannerOperations } from '@/hooks/admin/useAdminBanners';

export default function NewBannerPage() {
  const router = useRouter();
  const { createAsync, isCreating } = useBannerOperations();

  const handleSubmit = async (payload: any) => {
    // image: '/placeholder-product.svg' inicial. El admin sube la real en la
    // página de edit donde el endpoint /banners/:id/image requiere id válido.
    const withPlaceholder = { ...payload, image: '/placeholder-product.svg' };
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
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/banners')}
            isSubmitting={isCreating}
          />
        </CardContent>
      </Card>
    </div>
  );
}
