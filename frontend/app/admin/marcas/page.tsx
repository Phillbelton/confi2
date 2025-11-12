'use client';

import { useQuery } from '@tanstack/react-query';
import { Tag, Plus, AlertCircle } from 'lucide-react';
import { brandService } from '@/services/brands';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Brand } from '@/types';

export default function BrandsAdminPage() {
  // Fetch brands
  const { data, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => brandService.getAll(),
  });

  const brands = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marcas</h2>
          <p className="text-muted-foreground">
            Gestiona las marcas de tus productos
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Marca
        </Button>
      </div>

      {/* Brands Grid */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay marcas</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {brands.map((brand: Brand) => (
                <Card key={brand._id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{brand.name}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">{brand.slug}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {brand.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {brand.description}
                      </p>
                    )}
                    <Badge variant={brand.active ? 'default' : 'secondary'}>
                      {brand.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
