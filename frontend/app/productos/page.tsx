'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home, SlidersHorizontal, X, Search, ArrowUpDown } from 'lucide-react';
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
    setTimeout(() => { isUpdatingFromUrl.current = false; }, 0);
  }, [searchParams]);

  const { data: productsData, isLoading: productsLoading } = useProducts({
    ...filters,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: sortBy,
  });
  const { data: categoriesData } = useCategoriesHierarchical();
  const { data: brandsData } = useBrands();

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
    setFilters(prev => ({ ...prev, category: categoryId, subcategory: subcategoryId }));
    setCurrentPage(1);
  };
  const handleBrandChange = (brandIds: string[]) => {
    setFilters(prev => ({ ...prev, brands: brandIds.length > 0 ? brandIds : undefined }));
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
    setFilters(prev => ({ ...prev, onSale: hasPromotion || undefined }));
    setCurrentPage(1);
  };
  const handleClearFilters = () => { setFilters({}); setCurrentPage(1); };

  const categories = categoriesData || [];
  const brands = brandsData || [];
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  const selectedCategory = filters.category
    ? categories.find((cat) => cat._id === filters.category)
    : undefined;
  const selectedSubcategory = filters.subcategory && selectedCategory?.subcategories
    ? selectedCategory.subcategories.find((sub: { _id: string }) => sub._id === filters.subcategory)
    : undefined;

  const pageTitle = selectedSubcategory?.name || selectedCategory?.name || 'Todos los productos';

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  return (
    <div className="min-h-screen bg-secondary candy-bg">
      <div className="relative z-10">

        {/* ── Top bar: breadcrumb + title ── */}
        <div className="container mx-auto px-4 pt-5 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-3">
            <Link href="/" className="hover:text-white/70 transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
              Inicio
            </Link>
            <ChevronRight className="h-3 w-3" />
            {selectedCategory ? (
              <>
                <Link
                  href={`/productos?categoria=${selectedCategory._id}`}
                  className="hover:text-white/70 transition-colors"
                >
                  {selectedCategory.name}
                </Link>
                {selectedSubcategory && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-cyan-300/80">{selectedSubcategory.name}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-cyan-300/80">Productos</span>
            )}
          </nav>

          {/* Title + count */}
          <h1 className="font-display text-xl md:text-2xl font-bold text-white leading-tight">
            {pageTitle}
          </h1>
          {pagination && (
            <p className="text-xs text-white/30 mt-0.5">
              {pagination.totalDocs} producto{pagination.totalDocs !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* ── Main layout ── */}
        <div className="container mx-auto px-4 pb-12">
          <div className="flex gap-5 lg:gap-6">

            {/* Sidebar — Desktop */}
            <div className="hidden lg:block w-[260px] flex-shrink-0">
              <div className="sticky top-24">
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
            </div>

            {/* Products column */}
            <div className="flex-1 min-w-0">

              {/* ── Toolbar: recessed well with filter + sort ── */}
              <div className="jc-well flex items-center justify-between gap-3 px-3 py-2.5 mb-4">
                {/* Mobile filter */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <button className="lg:hidden jc-raised flex items-center gap-2 px-3 py-2 text-sm text-white/80 font-medium">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtros
                      {activeFilterCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[320px] bg-secondary/95 backdrop-blur-xl border-white/10 p-0"
                  >
                    <SheetHeader className="p-4 border-b border-white/[0.06]">
                      <SheetTitle className="text-white font-display">Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto h-[calc(100vh-64px)]">
                      <FiltersSidebarCentral
                        selectedCategory={filters.category}
                        selectedSubcategory={filters.subcategory}
                        selectedBrands={filters.brands || []}
                        priceRange={[filters.minPrice || 0, filters.maxPrice || 100000]}
                        hasPromotion={filters.onSale || false}
                        onCategoryChange={(cat, sub) => { handleCategoryChange(cat, sub); setMobileFiltersOpen(false); }}
                        onBrandChange={handleBrandChange}
                        onPriceChange={handlePriceChange}
                        onPromotionChange={handlePromotionChange}
                        onClearFilters={() => { handleClearFilters(); setMobileFiltersOpen(false); }}
                        onApplyFilters={() => setMobileFiltersOpen(false)}
                        className="bg-transparent border-0 shadow-none rounded-none"
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Result count — desktop */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-white/35">
                  <span>{pagination?.totalDocs || 0} resultados</span>
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-auto sm:w-44 jc-raised !border-white/[0.12] text-white/70 text-sm font-medium gap-2 h-9 px-3">
                    <ArrowUpDown className="h-3.5 w-3.5 text-white/40 shrink-0" />
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a3a4a] border-white/10 rounded-2xl shadow-xl p-1">
                    <SelectItem value="newest" className="text-white/80 focus:bg-white/10 focus:text-white rounded-xl text-sm">Más recientes</SelectItem>
                    <SelectItem value="price_asc" className="text-white/80 focus:bg-white/10 focus:text-white rounded-xl text-sm">Menor precio</SelectItem>
                    <SelectItem value="price_desc" className="text-white/80 focus:bg-white/10 focus:text-white rounded-xl text-sm">Mayor precio</SelectItem>
                    <SelectItem value="name_asc" className="text-white/80 focus:bg-white/10 focus:text-white rounded-xl text-sm">A - Z</SelectItem>
                    <SelectItem value="name_desc" className="text-white/80 focus:bg-white/10 focus:text-white rounded-xl text-sm">Z - A</SelectItem>
                    <SelectItem value="popular" className="text-white/80 focus:bg-white/10 focus:text-white rounded-xl text-sm">Más populares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Active filters — Joy-Con pills ── */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedCategory && (
                    <button onClick={() => handleCategoryChange(undefined)} className="jc-pill flex items-center gap-1.5 px-3 py-1.5 text-cyan-200 text-xs font-medium hover:bg-white/12">
                      {selectedCategory.name}
                      <X className="h-3 w-3 text-white/40" />
                    </button>
                  )}
                  {selectedSubcategory && (
                    <button onClick={() => handleCategoryChange(filters.category)} className="jc-pill flex items-center gap-1.5 px-3 py-1.5 text-cyan-200 text-xs font-medium hover:bg-white/12">
                      {selectedSubcategory.name}
                      <X className="h-3 w-3 text-white/40" />
                    </button>
                  )}
                  {filters.brands?.map(brandId => {
                    const brand = brands.find((b: { _id: string }) => b._id === brandId);
                    return brand ? (
                      <button key={brandId} onClick={() => handleBrandChange(filters.brands?.filter(id => id !== brandId) || [])} className="jc-pill flex items-center gap-1.5 px-3 py-1.5 text-cyan-200 text-xs font-medium hover:bg-white/12">
                        {brand.name}
                        <X className="h-3 w-3 text-white/40" />
                      </button>
                    ) : null;
                  })}
                  {(filters.minPrice || filters.maxPrice) && (
                    <button onClick={() => handlePriceChange([0, 100000])} className="jc-pill flex items-center gap-1.5 px-3 py-1.5 text-cyan-200 text-xs font-medium hover:bg-white/12">
                      ${filters.minPrice?.toLocaleString('es-CL') || 0} - ${filters.maxPrice?.toLocaleString('es-CL') || '100.000'}
                      <X className="h-3 w-3 text-white/40" />
                    </button>
                  )}
                  {filters.onSale && (
                    <button onClick={() => handlePromotionChange(false)} className="jc-pill flex items-center gap-1.5 px-3 py-1.5 text-pink-200 text-xs font-medium hover:bg-white/12">
                      Con descuento
                      <X className="h-3 w-3 text-white/40" />
                    </button>
                  )}
                  <button onClick={handleClearFilters} className="px-2 py-1.5 text-white/30 hover:text-white text-xs transition-colors">
                    Limpiar
                  </button>
                </div>
              )}

              {/* ── Products Grid ── */}
              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <div key={i} className="jc-panel overflow-hidden">
                      <Skeleton className="aspect-square bg-white/[0.04]" />
                      <div className="p-3 space-y-2.5">
                        <Skeleton className="h-4 w-3/4 bg-white/[0.06] rounded-lg" />
                        <Skeleton className="h-5 w-1/2 bg-white/[0.06] rounded-lg" />
                        <Skeleton className="h-9 w-full bg-white/[0.04] rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="jc-panel text-center py-16 px-6">
                  <div className="w-16 h-16 mx-auto mb-5 jc-well rounded-full flex items-center justify-center">
                    <Search className="h-7 w-7 text-white/25" />
                  </div>
                  <h2 className="text-lg font-display font-bold text-white mb-1.5">No encontramos productos</h2>
                  <p className="text-white/35 mb-5 text-sm max-w-xs mx-auto">
                    Intenta con otros filtros o busca algo diferente
                  </p>
                  <Button onClick={handleClearFilters} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-display font-bold h-10 px-6">
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

              {/* ── Pagination — Joy-Con bumper style ── */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="jc-raised w-10 h-10 flex items-center justify-center text-white/60 disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1 mx-1">
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

                      const isActive = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'w-10 h-10 rounded-xl font-display font-bold text-sm transition-all duration-150',
                            isActive
                              ? 'bg-primary text-white shadow-md shadow-primary/25'
                              : 'jc-raised text-white/50 hover:text-white'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasNextPage}
                    className="jc-raised w-10 h-10 flex items-center justify-center text-white/60 disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-screen bg-secondary candy-bg">
              <div className="container mx-auto px-4 py-8 relative z-10">
                <Skeleton className="h-4 w-24 mb-3 bg-white/[0.06] rounded-lg" />
                <Skeleton className="h-7 w-48 mb-5 bg-white/[0.08] rounded-lg" />
                <div className="flex gap-6">
                  <div className="hidden lg:block w-[260px]">
                    <div className="jc-panel p-4 space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full bg-white/[0.04] rounded-xl" />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Skeleton className="jc-well h-12 w-full mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="jc-panel overflow-hidden">
                          <Skeleton className="aspect-square bg-white/[0.04]" />
                          <div className="p-3 space-y-2">
                            <Skeleton className="h-4 w-3/4 bg-white/[0.06] rounded-lg" />
                            <Skeleton className="h-9 w-full bg-white/[0.04] rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
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
