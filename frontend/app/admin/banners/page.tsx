'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Image as ImageIcon, LayoutTemplate, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BannersTable } from '@/components/admin/banners/BannersTable';
import { HomeWireframe } from '@/components/admin/banners/HomeWireframe';
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
  const router = useRouter();
  const [placementFilter, setPlacementFilter] = useState<BannerPlacement | 'all'>('all');

  const { data: banners = [], isLoading, error } = useAdminBanners(
    placementFilter === 'all' ? undefined : placementFilter
  );

  const { remove, isRemoving } = useBannerOperations();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold tracking-tight">
            <span aria-hidden>🎁</span>
            Banners y promociones
          </h1>
          <p className="text-muted-foreground">
            Diseñá las franjas de promociones sobre la plantilla de la home
          </p>
        </div>
        <Button onClick={() => router.push('/admin/banners/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo banner
        </Button>
      </div>

      <Tabs defaultValue="layout">
        <TabsList>
          <TabsTrigger value="layout">
            <LayoutTemplate className="h-4 w-4" />
            Plantilla de home
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4" />
            Todos los banners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="pt-4">
          <HomeWireframe />
        </TabsContent>

        <TabsContent value="list" className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar:</span>
            <Select
              value={placementFilter}
              onValueChange={(v) => setPlacementFilter(v as BannerPlacement | 'all')}
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
              onEdit={(b: Banner) => router.push(`/admin/banners/${b._id}`)}
              onDelete={(id) => remove(id)}
              isDeleting={isRemoving}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
