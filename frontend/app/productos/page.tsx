'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronDown, Home, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProductCardCentral } from '@/components/products/ProductCardCentral';
import { FiltersSidebarCentral } from '@/components/products/FiltersSidebarCentral';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useProducts, useProductVariants } from '@/hooks/useProducts';
import { useCategoriesHierarchical } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { cn } from '@/lib/utils';
import type { ProductFilters as Filters, ProductParent, ProductVariant } from '@/types';

const ITEMS_PER_PAGE = 20;

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isUpdatingFromUrl = useRef(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || undefined,
    category: searchParams.get('categoria') || searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategoria') || searchParams.get('subcategory') || undefined,
    brands: searchParams.get('brands')?.split(',').filter(Boolean) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
    onSale: searchParams.get('onSale') === 'true' || undefined,
  });

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  // Sync filters with URL params
  useEffect(() => {
    isUpdatingFromUrl.current = true;

    const newFilters: Filters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('categoria') || searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategoria') || searchParams.get('subcategory') || undefined,
      brands: searchParams.get('brands')?.split(',').filter(Boolean) || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      featured: searchParams.get('featured') === 'true' || undefined,
      onSale: searchParams.get('onSale') === 'true' || undefined,
    };

    setFilters(newFilters);
    setCurrentPage(Number(searchParams.get('page')) || 1);
    setSortBy(searchParams.get('sort') || 'newest');

    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  // Fetch data
  const { data: productsData, isLoading: productsLoading } = useProducts({
    ...filters,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: sortBy,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesHierarchical();
  const { data: brandsData, isLoading: brandsLoading } = useBrands();

  // Update URL when filters change
  useEffect(() => {
    if (isUpdatingFromUrl.current) return;

    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('categoria', filters.category);
    if (filters.subcategory) params.set('subcategoria', filters.subcategory);
    if (filters.brands?.length) params.set('brands', filters.brands.join(','));
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    if (filters.featured) params.set('featured', 'true');
    if (filters.onSale) params.set('onSale', 'true');
    if (currentPage > 1) params.set('page', String(currentPage));
    if (sortBy !== 'newest') params.set('sort', sortBy);

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, currentPage, sortBy, router, pathname]);

  const handleCategoryChange = (categoryId: string | undefined, subcategoryId?: string) => {
    setFilters(prev => ({
      ...prev,
      category: categoryId,
      subcategory: subcategoryId,
    }));
    setCurrentPage(1);
  };

  const handleBrandChange = (brandIds: string[]) => {
    setFilters(prev => ({
      ...prev,
      brands: brandIds.length > 0 ? brandIds : undefined,
    }));
    setCurrentPage(1);
  };

  const handlePriceChange = (range: [number, number]) => {
    setFilters(prev => ({
      ...prev,
      minPrice: range[0] > 0 ? range[0] : undefined,
      maxPrice: range[1] < 100000 ? range[1] : undefined,
    }));
    setCurrentPage(1);
  };

  const handlePromotionChange = (hasPromotion: boolean) => {
    setFilters(prev => ({
      ...prev,
      onSale: hasPromotion || undefined,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const categories = categoriesData || [];
  const brands = brandsData || [];
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  // Get selected category name for breadcrumb
  const selectedCategory = filters.category
    ? categories.find((cat) => cat._id === filters.category)
    : undefined;

  const selectedSubcategory = filters.subcategory && selectedCategory?.subcategories
    ? selectedCategory.subcategories.find((sub: { _id: string }) => sub._id === filters.subcategory)
    : undefined;

  // Page title
  const pageTitle = selectedSubcategory?.name || selectedCategory?.name || 'Todos los productos';

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4" />
          {selectedCategory ? (
            <>
              <Link
                href={`/productos?categoria=${selectedCategory._id}`}
                className="hover:text-white transition-colors"
              >
                {selectedCategory.name}
              </Link>
              {selectedSubcategory && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-white">{selectedSubcategory.name}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-white">Productos</span>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FiltersSidebarCentral
              selectedCategory={filters.category}
              selectedSubcategory={filters.subcategory}
              selectedBrands={filters.brands || []}
              priceRange={[filters.minPrice || 0, filters.maxPrice || 100000]}
              hasPromotion={filters.onSale || false}
              onCategoryChange={handleCategoryChange}
              onBrandChange={handleBrandChange}
              onPriceChange={handlePriceChange}
              onPromotionChange={handlePromotionChange}
              onClearFilters={handleClearFilters}
              onApplyFilters={() => {}}
            />
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Header with product count and sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {pagination && (
                <p className="text-sm text-gray-400">
                  {pagination.totalItems} {pagination.totalItems === 1 ? 'producto' : 'productos'}
                </p>
              )}

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="lg:hidden border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 bg-[#1a1a2e] border-gray-700 p-0">
                    <SheetHeader className="p-4 border-b border-gray-700">
                      <SheetTitle className="text-white">Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="p-4">
                      <FiltersSidebarCentral
                        selectedCategory={filters.category}
                        selectedSubcategory={filters.subcategory}
                        selectedBrands={filters.brands || []}
                        priceRange={[filters.minPrice || 0, filters.maxPrice || 100000]}
                        hasPromotion={filters.onSale || false}
                        onCategoryChange={(cat, sub) => {
                          handleCategoryChange(cat, sub);
                          setMobileFiltersOpen(false);
                        }}
                        onBrandChange={handleBrandChange}
                        onPriceChange={handlePriceChange}
                        onPromotionChange={handlePromotionChange}
                        onClearFilters={() => {
                          handleClearFilters();
                          setMobileFiltersOpen(false);
                        }}
                        onApplyFilters={() => setMobileFiltersOpen(false)}
                        className="bg-transparent"
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-44 bg-[#1a1a2e] border-gray-600 text-white">
                    <SelectValue placeholder="Ordenar por:" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="price_asc">Menor precio</SelectItem>
                    <SelectItem value="price_desc">Mayor precio</SelectItem>
                    <SelectItem value="name_asc">A - Z</SelectItem>
                    <SelectItem value="name_desc">Z - A</SelectItem>
                    <SelectItem value="popular">Más populares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.category || filters.brands?.length || filters.minPrice || filters.maxPrice || filters.onSale) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory && (
                  <button
                    onClick={() => handleCategoryChange(undefined)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm hover:bg-primary/30 transition-colors"
                  >
                    {selectedCategory.name}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {selectedSubcategory && (
                  <button
                    onClick={() => handleCategoryChange(filters.category)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm hover:bg-primary/30 transition-colors"
                  >
                    {selectedSubcategory.name}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {filters.brands?.map(brandId => {
                  const brand = brands.find((b: { _id: string }) => b._id === brandId);
                  return brand ? (
                    <button
                      key={brandId}
                      onClick={() => handleBrandChange(filters.brands?.filter(id => id !== brandId) || [])}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm hover:bg-primary/30 transition-colors"
                    >
                      {brand.name}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null;
                })}
                {(filters.minPrice || filters.maxPrice) && (
                  <button
                    onClick={() => handlePriceChange([0, 100000])}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm hover:bg-primary/30 transition-colors"
                  >
                    ${filters.minPrice?.toLocaleString('es-CL') || 0} - ${filters.maxPrice?.toLocaleString('es-CL') || '100.000'}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {filters.onSale && (
                  <button
                    onClick={() => handlePromotionChange(false)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-accent/20 text-accent rounded-full text-sm hover:bg-accent/30 transition-colors"
                  >
                    Con descuento
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 text-gray-400 hover:text-white text-sm underline transition-colors"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden">
                    <Skeleton className="aspect-square" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold text-white mb-2">No encontramos productos</h2>
                <p className="text-gray-400 mb-6">Intenta con otros filtros o busca algo diferente</p>
                <Button onClick={handleClearFilters} className="bg-primary hover:bg-primary/90">
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {products.map((product: ProductParent & { variants?: ProductVariant[] }) => (
                  <ProductCardCentral
                    key={product._id}
                    product={product}
                    variants={product.variants || []}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          'w-10 h-10 p-0',
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a2e]">
      <Header />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-8">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="flex gap-6">
                <Skeleton className="hidden lg:block w-64 h-96" />
                <div className="flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <ProductsContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
