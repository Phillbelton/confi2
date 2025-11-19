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
import { CategoriesTable } from '@/components/admin/categories/CategoriesTable';
import { CategoryForm } from '@/components/admin/categories/CategoryForm';
import { useAdminCategories, useCategoryOperations } from '@/hooks/admin/useAdminCategories';
import { buildCategoryTree } from '@/lib/categoryUtils';
import type { Category } from '@/types';

export default function CategoriasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  const { data, isLoading, error } = useAdminCategories();
  const { create, update, deleteCategory, uploadImage, isCreating, isUpdating, isDeleting, isUploadingImage } =
    useCategoryOperations();

  const categories = data?.data?.categories || [];

  // Build hierarchical category tree for the table
  const categoriesTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  const handleOpenDialog = (category?: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategory(undefined);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
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

      {/* Categories Table */}
      {!isLoading && !error && (
        <CategoriesTable
          categories={categoriesTree}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Editar categoría' : 'Nueva categoría'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Modifica los datos de la categoría'
                : 'Completa los datos para crear una nueva categoría'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={selectedCategory}
            categories={categories}
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
