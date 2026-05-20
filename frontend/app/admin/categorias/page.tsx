'use client';

import { useState, useMemo } from 'react';
import { FolderTree, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoriesTree } from '@/components/admin/categories/CategoriesTree';
import { CategoryForm } from '@/components/admin/categories/CategoryForm';
import { useAdminCategories, useCategoryOperations } from '@/hooks/admin/useAdminCategories';
import type { Category } from '@/types';

export default function CategoriasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useAdminCategories();
  const { create, update, deleteCategory, uploadImage, isCreating, isUpdating, isDeleting, isUploadingImage } =
    useCategoryOperations();

  // El endpoint devuelve TODAS las categorías planas, cada una con sus hijos
  // embebidos en `subcategories[]`. Normalizamos para evitar duplicados:
  //  - `categories`  → lista plana deduplicada (para el select de padre)
  //  - `categoriesTree` → solo raíces, cada una con `subcategories` (para el árbol)
  const { categories, categoriesTree } = useMemo(() => {
    const raw: any[] = data?.data?.categories || [];
    const byId = new Map<string, Category>();
    const visit = (c: any) => {
      if (c?._id && !byId.has(c._id)) byId.set(c._id, c);
      if (Array.isArray(c?.subcategories)) c.subcategories.forEach(visit);
    };
    raw.forEach(visit);
    const flat = Array.from(byId.values());
    return {
      categories: flat,
      categoriesTree: flat.filter((c) => !c.parent),
    };
  }, [data]);

  const handleOpenDialog = (category?: Category) => {
    setSelectedCategory(category);
    setDefaultParentId(undefined);
    setIsDialogOpen(true);
  };

  const handleCreateSubcategory = (parent: Category) => {
    setSelectedCategory(undefined);
    setDefaultParentId(parent._id);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategory(undefined);
    setDefaultParentId(undefined);
  };

  const handleSubmit = (formData: any) => {
    if (selectedCategory) {
      // Update existing category
      update(
        { id: selectedCategory._id, data: formData },
        {
          onSuccess: () => {
            handleCloseDialog();
          },
        }
      );
    } else {
      // Create new category
      create(formData, {
        onSuccess: () => {
          handleCloseDialog();
        },
      });
    }
  };

  const handleDelete = (categoryId: string) => {
    deleteCategory(categoryId);
  };

  const handleUploadImage = (categoryId: string, file: File) => {
    uploadImage({ id: categoryId, file });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de productos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Cargando categorías...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar categorías</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No se pudieron cargar las categorías. Por favor, intenta nuevamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Categories Tree */}
      {!isLoading && !error && (
        <CategoriesTree
          categories={categoriesTree}
          onEdit={handleOpenDialog}
          onCreateSubcategory={handleCreateSubcategory}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory
                ? 'Editar categoría'
                : defaultParentId
                  ? 'Nueva subcategoría'
                  : 'Nueva categoría'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Modifica los datos de la categoría'
                : defaultParentId
                  ? `Crear una subcategoría dentro de "${categories.find((c) => c._id === defaultParentId)?.name || ''}"`
                  : 'Completa los datos para crear una nueva categoría'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={selectedCategory}
            categories={categories}
            defaultParentId={defaultParentId}
            onSubmit={handleSubmit}
            onUploadImage={handleUploadImage}
            onCancel={handleCloseDialog}
            isSubmitting={isCreating || isUpdating}
            isUploadingImage={isUploadingImage}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
