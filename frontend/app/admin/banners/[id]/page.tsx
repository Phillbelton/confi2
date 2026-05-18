'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BannerForm } from '@/components/admin/banners/BannerForm';
import {
  useAdminBanner,
  useBannerOperations,
} from '@/hooks/admin/useAdminBanners';

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: banner, isLoading } = useAdminBanner(id);
  const { update, uploadImage, isUpdating, isUploadingImage } =
    useBannerOperations();

  const handleSubmit = (payload: any) => {
    if (!id) return;
    update(
      { id, payload },
      { onSuccess: () => router.push('/admin/banners') }
    );
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
        Volver al listado
      </Button>

      <div>
        <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold tracking-tight">
          <span aria-hidden>🎁</span>
          Editar banner
        </h1>
        <p className="text-muted-foreground">
          {banner?.title || 'Cargando…'}
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : banner ? (
        <Card>
          <CardContent className="pt-6">
            <BannerForm
              banner={banner}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/admin/banners')}
              isSubmitting={isUpdating}
              onUploadImage={(bid, file, variant) =>
                uploadImage({ id: bid, file, variant })
              }
              isUploadingImage={isUploadingImage}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Banner no encontrado
          </CardContent>
        </Card>
      )}
    </div>
  );
}
