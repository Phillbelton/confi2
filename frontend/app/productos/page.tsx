'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import type { ProductFilters as Filters, ProductSort } from '@/types';

const ITEMS_PER_PAGE = 20;

const sortOptions = [
  { value: 'createdAt:desc', label: 'Más recientes' },
  { value: 'price:asc', label: 'Precio: menor a mayor' },
  { value: 'price:desc', label: 'Precio: mayor a menor' },
  { value: 'name:asc', label: 'Nombre: A-Z' },
  { value: 'views:desc', label: 'Más vistos' },
];

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || undefined,
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
    brands: searchParams.get('brands')?.split(',').filter(Boolean) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
    onSale: searchParams.get('onSale') === 'true' || undefined,
  });

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1
  );

  const [sortBy, setSortBy] = useState(
    searchParams.get('sort') || 'createdAt:desc'
  );

  // Fetch data
  const { data: productsData, isLoading: productsLoading } = useProducts({
    ...filters,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: sortBy,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: brandsData, isLoading: brandsLoading } = useBrands();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.categories?.length)
      params.set('categories', filters.categories.join(','));
    if (filters.brands?.length) params.set('brands', filters.brands.join(','));
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    if (filters.featured) params.set('featured', 'true');
    if (filters.onSale) params.set('onSale', 'true');
    if (currentPage > 1) params.set('page', String(currentPage));
    if (sortBy !== 'createdAt:desc') params.set('sort', sortBy);

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, currentPage, sortBy, router, pathname]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Productos
        </h1>
        <p className="text-muted-foreground mt-2">
          {pagination
            ? `Mostrando ${pagination.totalItems} productos`
            : 'Cargando productos...'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20">
            {categoriesLoading || brandsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
                brands={brands}
              />
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
            {/* Mobile Filters */}
            <div className="w-full sm:w-auto lg:hidden">
              {!categoriesLoading && !brandsLoading && (
                <ProductFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  categories={categories}
                  brands={brands}
                  isMobile
                />
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Ordenar por:
              </span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[400px] w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No se encontraron productos con los filtros seleccionados.
              </p>
              <button
                onClick={() => handleFilterChange({})}
                className="mt-4 text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  // TODO: Fetch variants for each product
                  variants={[]}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                Anterior
              </button>
              <span className="px-4 py-2 border rounded-md bg-primary text-primary-foreground">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <Suspense fallback={
            <div className="space-y-8">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          }>
            <ProductsContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
