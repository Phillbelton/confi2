'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Package,
  Grid3x3,
  List,
  ArrowUp,
  MessageCircle,
  Flame,
  Tag,
  Star,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ProductCardEnhanced } from '@/components/products/ProductCardEnhanced';
import { QuickViewModal } from '@/components/products/QuickViewModal';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useProducts, useProductVariants } from '@/hooks/useProducts';
import { useCategoriesHierarchical, useMainCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { cn } from '@/lib/utils';
import type { ProductFilters as Filters, ProductParent, Category, ProductVariant } from '@/types';

const ITEMS_PER_PAGE = 20;

const sortOptions = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre: A-Z' },
  { value: 'name_desc', label: 'Nombre: Z-A' },
];

function CategoryPills({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: Category[];
  selectedCategory?: string;
  onSelect: (id?: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -150 : 150,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 h-8 w-8 bg-background shadow-md"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        <button
          onClick={() => onSelect(undefined)}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            'border whitespace-nowrap',
            !selectedCategory
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted border-border'
          )}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => onSelect(cat._id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              'border whitespace-nowrap',
              selectedCategory === cat._id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            )}
          >
            {cat.icon && <span className="mr-1">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 h-8 w-8 bg-background shadow-md"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || undefined,
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
    brands: searchParams.get('brands')?.split(',').filter(Boolean) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
    onSale: searchParams.get('onSale') === 'true' || undefined,
  });

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductParent | null>(null);
  const [quickViewVariants, setQuickViewVariants] = useState<ProductVariant[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch data
  const { data: productsData, isLoading: productsLoading } = useProducts({
    ...filters,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: sortBy,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesHierarchical();
  const { data: mainCategories } = useMainCategories();
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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.categories?.length) params.set('categories', filters.categories.join(','));
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ ...filters, search: searchInput || undefined });
  };

  const handleCategoryPillSelect = (categoryId?: string) => {
    handleFilterChange({
      ...filters,
      categories: categoryId ? [categoryId] : undefined,
    });
  };

  const handleQuickFilter = (filterType: 'featured' | 'onSale') => {
    if (filterType === 'featured') {
      handleFilterChange({ ...filters, featured: !filters.featured, onSale: undefined });
    } else {
      handleFilterChange({ ...filters, onSale: !filters.onSale, featured: undefined });
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    handleFilterChange({ ...filters, search: undefined });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = categoriesData || [];
  const brands = brandsData?.data || [];
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;
  const selectedCategoryId = filters.categories?.[0];

  const activeFilterCount =
    (filters.categories?.length || 0) +
    (filters.brands?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  return (
    <>
      {/* Quick Access Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          <Button
            variant={filters.featured ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter('featured')}
            className="flex-shrink-0"
          >
            <Flame className="h-4 w-4 mr-2" />
            Destacados
          </Button>
          <Button
            variant={filters.onSale ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter('onSale')}
            className="flex-shrink-0"
          >
            <Tag className="h-4 w-4 mr-2" />
            Ofertas
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      {mainCategories && mainCategories.length > 0 && (
        <div className="mb-6">
          <CategoryPills
            categories={mainCategories}
            selectedCategory={selectedCategoryId}
            onSelect={handleCategoryPillSelect}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {pagination
            ? `${pagination.totalItems} productos encontrados`
            : 'Cargando...'}
        </div>

        {/* Sort and View Toggle */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] h-9">
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

          <div className="hidden sm:flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none rounded-l-lg"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none rounded-r-lg"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20">
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </h2>
              {categoriesLoading || brandsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
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
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filters */}
          <div className="lg:hidden mb-6">
            {!categoriesLoading && !brandsLoading && (
              <div className="flex items-center gap-3">
                <ProductFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  categories={categories}
                  brands={brands}
                  isMobile
                />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">
                    {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron productos
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                Intenta ajustar los filtros o buscar con otros términos.
              </p>
              <Button variant="outline" onClick={() => handleFilterChange({})}>
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4 sm:gap-6',
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              )}
            >
              {products.map((product: ProductParent, index: number) => (
                <ProductCardEnhanced
                  key={product._id}
                  product={product}
                  variants={(product as any).variants || []}
                  onQuickView={() => setQuickViewProduct(product)}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Anterior</span>
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
                      variant={currentPage === pageNum ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-9 h-9 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 transition-transform duration-300 z-40',
          showScrollTop ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="container flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Mostrando {products.length} de {pagination?.totalItems || 0}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={scrollToTop}>
              <ArrowUp className="h-4 w-4 mr-2" />
              Volver arriba
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ayuda
            </Button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        variants={quickViewVariants}
        open={!!quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-6 sm:py-8 md:px-6 md:py-12">
          <Suspense
            fallback={
              <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-24 rounded-full" />
                  ))}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
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
