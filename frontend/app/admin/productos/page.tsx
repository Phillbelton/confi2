'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFilters } from '@/components/admin/products/ProductFilters';
import { ProductsTable } from '@/components/admin/products/ProductsTable';
import { useAdminProducts } from '@/hooks/admin/useAdminProducts';
import type { ProductQueryParams } from '@/types';

export default function ProductosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProductQueryParams>({
    search: '',
    categories: [],
    brands: [],
    featured: undefined,
    inStock: undefined,
  });

  const {
    products,
    pagination,
    isLoading,
    deleteProduct,
    isDeleting,
    refetch,
  } = useAdminProducts({
    page,
    limit: 20,
    ...filters,
  });

  const handleCreateProduct = () => {
    router.push('/admin/productos/nuevo');
  };

  const handleEditProduct = (id: string) => {
    router.push(`/admin/productos/${id}/editar`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona tus productos y variantes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Results Count */}
      {pagination && (
        <div className="text-sm text-muted-foreground">
          Mostrando {products.length} de {pagination.totalItems} productos
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <ProductsTable
          products={products}
          onEdit={handleEditProduct}
          onDelete={deleteProduct}
          isDeleting={isDeleting}
        />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {[...Array(pagination.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={pageNum === page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (pageNum === page - 2 || pageNum === page + 2) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className={
                  page === pagination.totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
