'use client';

import { useState, useCallback } from 'react';
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
import type { ProductParent } from '@/types';
import { getImageUrl } from '@/lib/images';

interface ProductsTableProps {
  products: ProductParent[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const COLUMNS = [
  { id: 'image',      label: 'Imagen',     defaultWidth: 88,  minWidth: 72,  resizable: false, align: 'left'   },
  { id: 'name',       label: 'Nombre',     defaultWidth: '45%', minWidth: 140, resizable: true,  align: 'left'   },
  { id: 'categories', label: 'Categorías', defaultWidth: 180, minWidth: 100, resizable: true,  align: 'left'   },
  { id: 'brand',      label: 'Marca',      defaultWidth: 120, minWidth: 80,  resizable: true,  align: 'left'   },
  { id: 'variants',   label: 'Variantes',  defaultWidth: 100, minWidth: 80,  resizable: true,  align: 'center' },
  { id: 'status',     label: 'Estado',     defaultWidth: 90,  minWidth: 72,  resizable: false, align: 'center' },
  { id: 'actions',    label: 'Acciones',   defaultWidth: 72,  minWidth: 60,  resizable: false, align: 'center' },
] as const;

type ColId = (typeof COLUMNS)[number]['id'];
type ColWidths = Record<ColId, number | string>;

export function ProductsTable({ products, onEdit, onDelete, isDeleting }: ProductsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductParent | null>(null);
  const [colWidths, setColWidths] = useState<ColWidths>(
    Object.fromEntries(COLUMNS.map((c) => [c.id, c.defaultWidth])) as ColWidths
  );

  const startResize = useCallback(
    (colId: ColId, minWidth: number, e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      // Si el ancho es un string (ej: '45%'), leer el px real del th renderizado
      const th = (e.currentTarget as HTMLElement).closest('th');
      const startWidth = typeof colWidths[colId] === 'number'
        ? (colWidths[colId] as number)
        : (th?.offsetWidth ?? 280);

      const onMove = (ev: MouseEvent) => {
        const newWidth = Math.max(minWidth, startWidth + ev.clientX - startX);
        setColWidths((prev) => ({ ...prev, [colId]: newWidth }));
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [colWidths]
  );

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
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table style={{ tableLayout: 'fixed', width: '100%', minWidth: 600 }}>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.id}
                  style={{ width: colWidths[col.id as ColId] }}
                  className={`relative select-none overflow-hidden whitespace-nowrap${col.align === 'center' ? ' text-center' : ''}`}
                >
                  <span className="truncate block pr-2">{col.label}</span>
                  {col.resizable && (
                    <div
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary transition-colors z-10"
                      onMouseDown={(e) => startResize(col.id as ColId, col.minWidth, e)}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const primaryImage =
                product.images && product.images.length > 0 ? product.images[0] : null;

              const categoryNames = Array.isArray(product.categories)
                ? product.categories
                    .map((cat: any) => (typeof cat === 'string' ? cat : cat.name))
                    .join(', ')
                : 'Sin categoría';

              const brandName = product.brand
                ? typeof product.brand === 'string'
                  ? product.brand
                  : product.brand.name
                : '-';

              const variantCount = product.variantAttributes?.length || 0;

              return (
                <TableRow key={product._id}>
                  {/* Imagen */}
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

                  {/* Nombre */}
                  <TableCell className="overflow-hidden">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        {product.featured && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.description}
                      </p>
                    </div>
                  </TableCell>

                  {/* Categorías */}
                  <TableCell className="overflow-hidden">
                    <p className="text-sm truncate" title={categoryNames}>
                      {categoryNames}
                    </p>
                  </TableCell>

                  {/* Marca */}
                  <TableCell className="overflow-hidden">
                    <p className="text-sm truncate">{brandName}</p>
                  </TableCell>

                  {/* Variantes */}
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {variantCount} {variantCount === 1 ? 'atrib.' : 'atribs.'}
                    </Badge>
                  </TableCell>

                  {/* Estado */}
                  <TableCell className="text-center">
                    {product.active ? (
                      <Badge variant="default" className="bg-green-600">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-center">
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el producto &ldquo;{productToDelete?.name}&rdquo;. Esta
              acción no se puede deshacer y también eliminará todas las variantes asociadas.
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
