'use client';

import { useState } from 'react';
import { Edit, Eye, MoreVertical, Package, Star, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ProductParent, Category, Brand } from '@/types';
import { getImageUrl } from '@/lib/images';

interface ProductsTableProps {
  products: ProductParent[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  isDeleting,
}: ProductsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductParent | null>(null);

  const handleDeleteClick = (product: ProductParent) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDelete(productToDelete._id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-md border bg-card">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium mb-1">No se encontraron productos</p>
          <p className="text-sm">Intenta ajustar los filtros o crea un nuevo producto</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categorías</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead className="text-center">Variantes</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const primaryImage = product.images && product.images.length > 0
                ? product.images[0]
                : null;

              const categoryNames = Array.isArray(product.categories)
                ? product.categories.map((cat: any) =>
                    typeof cat === 'string' ? cat : cat.name
                  ).join(', ')
                : 'Sin categoría';

              const brandName = product.brand
                ? (typeof product.brand === 'string' ? product.brand : product.brand.name)
                : '-';

              const variantCount = product.variantAttributes?.length || 0;

              return (
                <TableRow key={product._id}>
                  {/* Image */}
                  <TableCell>
                    <div className="w-16 h-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                      {primaryImage ? (
                        <img
                          src={getImageUrl(primaryImage)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{product.name}</p>
                          {product.featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Categories */}
                  <TableCell>
                    <p className="text-sm truncate max-w-[200px]">{categoryNames}</p>
                  </TableCell>

                  {/* Brand */}
                  <TableCell>
                    <p className="text-sm">{brandName}</p>
                  </TableCell>

                  {/* Variant Count */}
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {variantCount} {variantCount === 1 ? 'atributo' : 'atributos'}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    {product.active ? (
                      <Badge variant="default" className="bg-green-600">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(product._id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/productos/${product.slug}`, '_blank')}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver en tienda
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(product)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el producto "{productToDelete?.name}".
              Esta acción no se puede deshacer y también eliminará todas las variantes asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
