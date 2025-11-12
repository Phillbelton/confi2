'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderTree, Plus, AlertCircle } from 'lucide-react';
import { categoryService } from '@/services/categories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types';

export default function CategoriesAdminPage() {
  // Fetch categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoryService.getAll(),
  });

  const categories = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categorías</h2>
          <p className="text-muted-foreground">
            Gestiona las categorías de tu catálogo
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categories Grid */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay categorías</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category: Category) => (
                <Card key={category._id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color || '#e5e7eb' }}
                      >
                        <FolderTree className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{category.slug}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant={category.active ? 'default' : 'secondary'}>
                        {category.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      {category.parent && (
                        <Badge variant="outline">Subcategoría</Badge>
                      )}
                    </div>
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
