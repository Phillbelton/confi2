'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home, SlidersHorizontal, X, Search, ArrowUpDown, RotateCcw } from 'lucide-react';
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
import { ProductCardUnified } from '@/components/products/ProductCardUnified';
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

  // Pending filters for mobile — accumulate changes, apply on "Aplicar"
  const [pendingFilters, setPendingFilters] = useState<Filters>({});

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

  const handleCategoryChange = (categoryId: string | undefined, subcategoryIds?: string[]) => {
    setFilters(prev => ({
      ...prev,
      category: categoryId,
      subcategory: subcategoryIds?.length ? subcategoryIds.join(',') : undefined,
    }));
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

  // ── Mobile pending filter handlers ──
  // Sync pending filters when opening the sheet; auto-aplicar al cerrar
  // (si el usuario cierra el sheet sin tocar "Aplicar", tomamos sus cambios
  // pendientes como intención y los aplicamos igual).
  const handleOpenMobileFilters = (open: boolean) => {
    if (open) {
      setPendingFilters({ ...filters });
    } else {
      const changed = JSON.stringify(pendingFilters) !== JSON.stringify(filters);
      if (changed) {
        setFilters(pendingFilters);
        setCurrentPage(1);
      }
    }
    setMobileFiltersOpen(open);
  };

  const handlePendingCategoryChange = (categoryId: string | undefined, subcategoryIds?: string[]) => {
    setPendingFilters(prev => ({
      ...prev,
      category: categoryId,
      subcategory: subcategoryIds?.length ? subcategoryIds.join(',') : undefined,
    }));
  };
  const handlePendingBrandChange = (brandIds: string[]) => {
    setPendingFilters(prev => ({ ...prev, brands: brandIds.length > 0 ? brandIds : undefined }));
  };
  const handlePendingPriceChange = (range: [number, number]) => {
    setPendingFilters(prev => ({
      ...prev,
      minPrice: range[0] > 0 ? range[0] : undefined,
      maxPrice: range[1] < 100000 ? range[1] : undefined,
    }));
  };
  const handlePendingPromotionChange = (hasPromotion: boolean) => {
    setPendingFilters(prev => ({ ...prev, onSale: hasPromotion || undefined }));
  };
  const handlePendingClearFilters = () => {
    setPendingFilters({});
  };
  const handleApplyMobileFilters = () => {
    setFilters(pendingFilters);
    setCurrentPage(1);
    setMobileFiltersOpen(false);
  };

  const pendingFilterCount =
    (pendingFilters.category ? 1 : 0) +
    (pendingFilters.subcategory?.split(',').filter(Boolean).length || 0) +
    (pendingFilters.brands?.length || 0) +
    (pendingFilters.minPrice || pendingFilters.maxPrice ? 1 : 0) +
    (pendingFilters.onSale ? 1 : 0);

  const categories = categoriesData || [];
  const brands = brandsData || [];
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  const selectedCategory = filters.category
    ? categories.find((cat) => cat._id === filters.category)
    : undefined;
  const subcategoryIds = filters.subcategory?.split(',').filter(Boolean) || [];
  const selectedSubcategories = selectedCategory?.subcategories
    ? selectedCategory.subcategories.filter((sub: { _id: string }) => subcategoryIds.includes(sub._id))
    : [];

  const pageTitle =
    selectedSubcategories.length === 1
      ? selectedSubcategories[0].name
      : selectedCategory?.name || 'Todos los productos';

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    subcategoryIds.length +
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  return (
    <div className="min-h-screen theme-catalog bg-background section-with-pattern">
      <div className="pattern-dots absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10">

        {/* ── Top bar: breadcrumb + title ── */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
              Inicio
            </Link>
            <ChevronRight className="h-3 w-3" />
            {selectedCategory ? (
              <>
                <Link
                  href={`/productos?categoria=${selectedCategory._id}`}
                  className="hover:text-foreground transition-colors"
                >
                  {selectedCategory.name}
                </Link>
                {selectedSubcategories.length === 1 && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">{selectedSubcategories[0].name}</span>
                  </>
                )}
                {selectedSubcategories.length > 1 && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">
                      {selectedSubcategories.map((s: { name: string }) => s.name).join(', ')}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-foreground font-medium">Productos</span>
            )}
          </nav>

          {/* Title + count */}
          <h1 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight">
            {pageTitle}
          </h1>
          {pagination && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {pagination.totalDocs} producto{pagination.totalDocs !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* ── Main layout ── */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex gap-5 lg:gap-6">

            {/* Sidebar — Desktop */}
            <div className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-[var(--header-height-desktop)]">
                <FiltersSidebarCentral
                  selectedCategory={filters.category}
                  selectedSubcategories={filters.subcategory?.split(',').filter(Boolean) || []}
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

              {/* ── Toolbar: sticky on mobile ── */}
              <div className="sticky top-0 z-30 bg-card rounded-lg border border-border shadow-sm flex items-center justify-between gap-3 px-3 py-2.5 mb-4">
                {/* Mobile filter */}
                <Sheet open={mobileFiltersOpen} onOpenChange={handleOpenMobileFilters}>
                  <SheetTrigger asChild>
                    <button className="lg:hidden flex items-center gap-2 h-10 px-3 text-sm text-foreground font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtros
                      {activeFilterCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="theme-catalog w-[min(320px,85vw)] bg-background border-border p-0 flex flex-col"
                  >
                    {/* Header */}
                    <SheetHeader className="p-4 border-b border-border flex-shrink-0 bg-warm-cream">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-handwriting text-lg text-foreground">Filtros</SheetTitle>
                        {pendingFilterCount > 0 && (
                          <button
                            onClick={handlePendingClearFilters}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Limpiar todo
                          </button>
                        )}
                      </div>
                    </SheetHeader>

                    {/* Scrollable filters */}
                    <div className="flex-1 overflow-y-auto">
                      <FiltersSidebarCentral
                        selectedCategory={pendingFilters.category}
                        selectedSubcategories={pendingFilters.subcategory?.split(',').filter(Boolean) || []}
                        selectedBrands={pendingFilters.brands || []}
                        priceRange={[pendingFilters.minPrice || 0, pendingFilters.maxPrice || 100000]}
                        hasPromotion={pendingFilters.onSale || false}
                        onCategoryChange={handlePendingCategoryChange}
                        onBrandChange={handlePendingBrandChange}
                        onPriceChange={handlePendingPriceChange}
                        onPromotionChange={handlePendingPromotionChange}
                        onClearFilters={handlePendingClearFilters}
                        onApplyFilters={handleApplyMobileFilters}
                        hideHeader
                        className="bg-transparent border-0 shadow-none rounded-none"
                      />
                    </div>

                    {/* Sticky Apply Bar */}
                    <div className="flex-shrink-0 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                      <Button
                        onClick={handleApplyMobileFilters}
                        className="w-full h-12 font-display font-bold text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-all active:scale-[0.98]"
                      >
                        Aplicar filtros
                        {pendingFilterCount > 0 && (
                          <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                            {pendingFilterCount}
                          </span>
                        )}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Result count — desktop */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{pagination?.totalDocs || 0} resultados</span>
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-auto sm:w-44 border-border text-foreground text-sm font-medium gap-2 h-10 px-3 rounded-lg">
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-lg shadow-lg">
                    <SelectItem value="newest" className="text-popover-foreground rounded-md text-sm">Más recientes</SelectItem>
                    <SelectItem value="price_asc" className="text-popover-foreground rounded-md text-sm">Menor precio</SelectItem>
                    <SelectItem value="price_desc" className="text-popover-foreground rounded-md text-sm">Mayor precio</SelectItem>
                    <SelectItem value="name_asc" className="text-popover-foreground rounded-md text-sm">A - Z</SelectItem>
                    <SelectItem value="name_desc" className="text-popover-foreground rounded-md text-sm">Z - A</SelectItem>
                    <SelectItem value="popular" className="text-popover-foreground rounded-md text-sm">Más populares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Active filters ── */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                  {selectedCategory && (
                    <button onClick={() => handleCategoryChange(undefined)} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full text-foreground text-xs font-medium hover:bg-border transition-colors">
                      {selectedCategory.name}
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  {selectedSubcategories.map((sub: { _id: string; name: string }) => (
                    <button
                      key={sub._id}
                      onClick={() => {
                        const remaining = subcategoryIds.filter(id => id !== sub._id);
                        handleCategoryChange(filters.category, remaining.length > 0 ? remaining : undefined);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full text-foreground text-xs font-medium hover:bg-border transition-colors"
                    >
                      {sub.name}
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                  {filters.brands?.map(brandId => {
                    const brand = brands.find((b: { _id: string }) => b._id === brandId);
                    return brand ? (
                      <button key={brandId} onClick={() => handleBrandChange(filters.brands?.filter(id => id !== brandId) || [])} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full text-foreground text-xs font-medium hover:bg-border transition-colors">
                        {brand.name}
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    ) : null;
                  })}
                  {(filters.minPrice || filters.maxPrice) && (
                    <button onClick={() => handlePriceChange([0, 100000])} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full text-foreground text-xs font-medium hover:bg-border transition-colors">
                      ${filters.minPrice?.toLocaleString('es-CL') || 0} - ${filters.maxPrice?.toLocaleString('es-CL') || '100.000'}
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  {filters.onSale && (
                    <button onClick={() => handlePromotionChange(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-medium hover:bg-accent/15 transition-colors">
                      Con descuento
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-accent text-xs font-semibold hover:bg-accent/15 transition-colors active:scale-[0.98]"
                    title="Limpiar todos los filtros"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Limpiar todo
                  </button>
                </div>
              )}

              {/* ── Products Grid ── */}
              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                      <Skeleton className="aspect-square bg-muted" />
                      <div className="p-3 space-y-2.5">
                        <Skeleton className="h-4 w-3/4 bg-muted rounded-md" />
                        <Skeleton className="h-5 w-1/2 bg-muted rounded-md" />
                        <Skeleton className="h-9 w-full bg-muted rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-card rounded-lg border border-border shadow-sm text-center py-16 px-6">
                  <div className="w-16 h-16 mx-auto mb-5 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-display font-bold text-foreground mb-1.5">No encontramos productos</h2>
                  <p className="text-handwriting text-lg text-muted-foreground mb-5 max-w-xs mx-auto">
                    Intenta con otros filtros o busca algo diferente
                  </p>
                  <Button onClick={handleClearFilters} className="bg-primary hover:bg-primary/90 text-white rounded-lg font-bold h-10 px-6">
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {products.map((product: ProductParent & { variants?: ProductVariant[] }) => (
                    <ProductCardUnified
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
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
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
                            'w-10 h-10 rounded-lg font-bold text-sm transition-all duration-150',
                            isActive
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
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
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
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
            <div className="min-h-screen theme-catalog bg-background">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <Skeleton className="h-4 w-24 mb-3 bg-muted rounded-md" />
                <Skeleton className="h-7 w-48 mb-5 bg-muted rounded-md" />
                <div className="flex gap-6">
                  <div className="hidden lg:block w-64">
                    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full bg-muted rounded-md" />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-12 w-full mb-4 bg-card rounded-lg border border-border" />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                          <Skeleton className="aspect-square bg-muted" />
                          <div className="p-3 space-y-2">
                            <Skeleton className="h-4 w-3/4 bg-muted rounded-md" />
                            <Skeleton className="h-9 w-full bg-muted rounded-lg" />
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
