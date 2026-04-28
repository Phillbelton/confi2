'use client';

import { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CollectionsTable } from '@/components/admin/collections/CollectionsTable';
import { CollectionForm } from '@/components/admin/collections/CollectionForm';
import {
  useAdminCollections,
  useCollectionOperations,
} from '@/hooks/admin/useAdminCollections';
import type { Collection } from '@/types';

export default function ColeccionesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Collection | undefined>(undefined);

  const { data, isLoading, error } = useAdminCollections('all');
  const {
    create,
    update,
    deleteCollection,
    uploadImage,
    isCreating,
    isUpdating,
    isDeleting,
    isUploadingImage,
  } = useCollectionOperations();

  const collections: Collection[] = (data?.data as any)?.collections || [];

  const handleOpenDialog = (collection?: Collection) => {
    setSelected(collection);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelected(undefined);
  };

  const handleSubmit = (formData: any) => {
    // Limpiar undefineds. Mantener `image: ''` explícito (señal de "borrar imagen")
    // y string vacío en otros campos opcionales para no enviar basura.
    const cleaned: any = {};
    for (const [k, v] of Object.entries(formData)) {
      if (v === undefined) continue;
      // image: '' es señal explícita de remover → conservar
      if (k === 'image') {
        cleaned[k] = v;
        continue;
      }
      if (v !== '') cleaned[k] = v;
    }

    if (selected) {
      update(
        { id: selected._id, data: cleaned },
        { onSuccess: handleCloseDialog }
      );
    } else {
      create(cleaned, { onSuccess: handleCloseDialog });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold tracking-tight">
            <span aria-hidden>🎀</span>
            Colecciones
          </h1>
          <p className="text-muted-foreground">
            Listas curadas de productos que aparecen en home y filtran el catálogo
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva colección
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Cargando colecciones...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar colecciones</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No se pudieron cargar las colecciones. Verificá la conexión y volvé a intentar.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <CollectionsTable
          collections={collections}
          onEdit={handleOpenDialog}
          onDelete={(id) => deleteCollection(id)}
          isDeleting={isDeleting}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected ? 'Editar colección' : 'Nueva colección'}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? 'Modificá los datos. Los cambios se reflejan en home y catálogo automáticamente.'
                : 'Una colección agrupa productos curados (como una "categoría blanda" personalizada).'}
            </DialogDescription>
          </DialogHeader>
          <CollectionForm
            collection={selected}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={isCreating || isUpdating}
            onUploadImage={(id, file) => uploadImage({ id, file })}
            isUploadingImage={isUploadingImage}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
