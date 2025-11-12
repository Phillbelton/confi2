'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Package,
  AlertCircle,
  Star,
  TrendingUp,
} from 'lucide-react';
import { productService } from '@/services/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProductParent } from '@/types';

export default function ProductsAdminPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Build query params
  const queryParams: any = { page, limit };
  if (search) queryParams.search = search;

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => productService.getProducts(queryParams),
  });

  const products = data?.data || [];
  const pagination = data?.pagination;

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
          <p className="text-muted-foreground">
            Gestiona tu catálogo de productos y variantes
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm mt-2">
                {search ? 'Intenta con otra búsqueda' : 'Comienza creando tu primer producto'}
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/admin/productos/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Producto
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categorías</TableHead>
                      <TableHead>Variantes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Destacado</TableHead>
                      <TableHead>Vistas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: ProductParent) => {
                      const categories = Array.isArray(product.categories)
                        ? product.categories
                        : [];
                      const categoryNames =
                        categories.length > 0
                          ? categories
                              .map((cat: any) => (typeof cat === 'string' ? cat : cat.name))
                              .join(', ')
                          : 'Sin categoría';

                      return (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.slug}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {categoryNames}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {product.variantAttributes.length} atributos
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.active ? 'default' : 'secondary'}>
                              {product.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.featured ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {product.views || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/productos/${product.slug}`} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/admin/productos/${product._id}/editar`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * limit + 1} -{' '}
                    {Math.min(page * limit, pagination.total)} de {pagination.total} productos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.pages}
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
