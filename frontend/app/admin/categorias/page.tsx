'use client';

import { FolderTree, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CategoriasPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de productos
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestión de Categorías</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Aquí podrás crear, editar y organizar las categorías de tus
            productos con jerarquía de dos niveles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
