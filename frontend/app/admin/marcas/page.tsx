'use client';

import { useState } from 'react';
import { Tags, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrandsTable } from '@/components/admin/brands/BrandsTable';
import { BrandForm } from '@/components/admin/brands/BrandForm';
import { useAdminBrands, useBrandOperations } from '@/hooks/admin/useAdminBrands';
import type { Brand } from '@/types';

export default function MarcasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>(undefined);

  const { data, isLoading, error } = useAdminBrands();
  const { create, update, deleteBrand, uploadLogo, isCreating, isUpdating, isDeleting, isUploadingLogo } =
    useBrandOperations();

  const brands = data?.data?.brands || [];

  const handleOpenDialog = (brand?: Brand) => {
    setSelectedBrand(brand);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedBrand(undefined);
  };

  const handleSubmit = (formData: any) => {
    if (selectedBrand) {
      // Update existing brand
      update(
        { id: selectedBrand._id, data: formData },
        {
          onSuccess: () => {
            handleCloseDialog();
          },
        }
      );
    } else {
      // Create new brand
      create(formData, {
        onSuccess: () => {
          handleCloseDialog();
        },
      });
    }
  };

  const handleDelete = (brandId: string) => {
    deleteBrand(brandId);
  };

  const handleUploadLogo = (brandId: string, file: File) => {
    uploadLogo({ id: brandId, file });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
          <p className="text-muted-foreground">
            Gestiona las marcas de productos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Marca
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Cargando marcas...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tags className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar marcas</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No se pudieron cargar las marcas. Por favor, intenta nuevamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Brands Table */}
      {!isLoading && !error && (
        <BrandsTable
          brands={brands}
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
              {selectedBrand ? 'Editar marca' : 'Nueva marca'}
            </DialogTitle>
            <DialogDescription>
              {selectedBrand
                ? 'Modifica los datos de la marca'
                : 'Completa los datos para crear una nueva marca'}
            </DialogDescription>
          </DialogHeader>
          <BrandForm
            brand={selectedBrand}
            onSubmit={handleSubmit}
            onUploadLogo={handleUploadLogo}
            onCancel={handleCloseDialog}
            isSubmitting={isCreating || isUpdating}
            isUploadingLogo={isUploadingLogo}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
