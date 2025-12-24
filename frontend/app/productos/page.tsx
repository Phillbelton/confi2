'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonGrid } from '@/components/ui/skeleton-card';
import {
  HeroSection,
  AppliedFilters,
  FiltersAside,
  FiltersSimplified,
  ToolbarPremium,
  ProductGridPremium,
  EmptyState,
} from '@/components/products/premium';
import { PremiumSection } from '@/components/ui/premium-section';
import { QuickViewModal } from '@/components/products/QuickViewModal';
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
  const productsGridRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromUrl = useRef(false);

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
  const [quickViewProduct, setQuickViewProduct] = useState<ProductParent | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<ProductVariant[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sync filters with URL params when they change (e.g., from navbar navigation)
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

    // Reset flag after state updates
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  // Scroll to products grid when category/subcategory filter is applied
  useEffect(() => {
    if (filters.category || filters.subcategory) {
      // Wait for next tick to ensure DOM is updated
      setTimeout(() => {
        productsGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [filters.category, filters.subcategory]);

  // Fetch data
  const { data: productsData, isLoading: productsLoading } = useProducts({
    ...filters,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: sortBy,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesHierarchical();
  const { data: brandsData, isLoading: brandsLoading } = useBrands();

  // Fetch variants for quick view
  const { data: variantsData } = useProductVariants(quickViewProduct?._id || '');

  useEffect(() => {
    if (variantsData?.data) {
      setQuickViewVariants(variantsData.data);
    }
  }, [variantsData]);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update URL when filters change (but not when syncing from URL)
  useEffect(() => {
    // Skip URL update if we're currently syncing from URL
    if (isUpdatingFromUrl.current) {
      return;
    }

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

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreClick = () => {
    productsGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const categories = categoriesData || [];
  const brands = brandsData || []; // brandService.getAll() ya retorna el array directamente
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;

  // Get subcategories of selected category
  const selectedCategory = filters.category
    ? categories.find((cat) => cat._id === filters.category)
    : undefined;
  const subcategories = selectedCategory?.subcategories || [];

  // Get selected subcategory
  const selectedSubcategory = filters.subcategory
    ? subcategories.find((subcat) => subcat._id === filters.subcategory)
    : undefined;

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <HeroSection onExploreClick={handleExploreClick} />

      {/* ===== PRODUCTS GRID SECTION ===== */}
      <div ref={productsGridRef} className="scroll-mt-20">
        {/* ===== APPLIED FILTERS ===== */}
        <AppliedFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
          brands={brands}
        />

        {/* ===== TOOLBAR ===== */}
        <ToolbarPremium
          totalItems={pagination?.totalItems}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
        />

        {/* ===== MAIN CONTENT: FILTERS + PRODUCTS ===== */}
        <PremiumSection transparent waveBottom={false}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* FILTERS SIDEBAR (Desktop) */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-20">
              {categoriesLoading || brandsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <FiltersAside
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  brands={brands}
                  categories={categories}
                  subcategories={subcategories}
                  productCount={pagination?.totalItems}
                />
              )}
            </div>
          </aside>

          {/* PRODUCTS GRID */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filters */}
            <div className="lg:hidden mb-6">
              {!categoriesLoading && !brandsLoading && (
                <FiltersSimplified
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  brands={brands}
                  categories={categories}
                  subcategories={subcategories}
                  productCount={pagination?.totalItems}
                />
              )}
            </div>

            {/* Products or Loading/Empty */}
            {productsLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <SkeletonGrid
                  count={ITEMS_PER_PAGE}
                  columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                />
              </motion.div>
            ) : products.length === 0 ? (
              <EmptyState
                type="no-results"
                onReset={() => handleFilterChange({})}
              />
            ) : (
              <ProductGridPremium
                products={products}
                onQuickView={setQuickViewProduct}
                loading={productsLoading}
              />
            )}

            {/* ===== PAGINATION ===== */}
            {pagination && pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 mt-12"
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="shadow-sm hover:shadow-premium hover:scale-105 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>

                <div className="flex items-center gap-2">
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
                      <motion.div
                        key={pageNum}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="lg"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'w-10 h-10 p-0 transition-all',
                            currentPage === pageNum && 'gradient-primary text-white shadow-premium'
                          )}
                        >
                          {pageNum}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className="shadow-sm hover:shadow-premium hover:scale-105 transition-all"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </PremiumSection>

      {/* ===== STICKY BOTTOM ACTIONS ===== */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: showScrollTop ? 0 : 100 }}
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t p-4 z-40 shadow-premium-lg"
      >
        <div className="container flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {products.length > 0 && (
              <>
                Mostrando <span className="text-primary font-bold">{products.length}</span> de{' '}
                <span className="text-primary font-bold">{pagination?.totalItems || 0}</span>
              </>
            )}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={scrollToTop} className="shadow-sm">
              <ArrowUp className="h-4 w-4 mr-2" />
              Volver arriba
            </Button>
            <Button variant="outline" size="sm" className="shadow-sm hidden sm:flex">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ayuda
            </Button>
          </div>
        </div>
      </motion.div>

        {/* ===== QUICK VIEW MODAL ===== */}
        <QuickViewModal
          product={quickViewProduct}
          variants={quickViewVariants}
          open={!!quickViewProduct}
          onOpenChange={(open) => !open && setQuickViewProduct(null)}
        />
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container px-2 sm:px-4 py-6 sm:py-8 md:px-6 lg:py-12">
          <Suspense
            fallback={
              <div className="space-y-8">
                {/* Hero Skeleton */}
                <div className="w-full h-64 bg-gradient-subtle rounded-2xl animate-pulse" />

                {/* Search Skeleton */}
                <Skeleton className="h-14 w-full rounded-xl" />

                {/* Category Pills Skeleton */}
                <div className="flex gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-32 rounded-full" />
                  ))}
                </div>

                {/* Toolbar Skeleton */}
                <Skeleton className="h-16 w-full rounded-xl" />

                {/* Grid Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              </div>
            }
          >
            <ProductsContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
