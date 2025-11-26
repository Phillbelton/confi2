'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Package, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import type { ProductParent } from '@/types';
import Image from 'next/image';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products based on debounced query
  const { data: productsData, isLoading } = useProducts(
    debouncedQuery.length > 0
      ? {
          search: debouncedQuery,
          limit: 8,
        }
      : undefined
  );

  const products = productsData?.data || [];

  const handleSelectProduct = useCallback(
    (slug: string) => {
      onOpenChange(false);
      setSearchQuery('');
      router.push(`/productos/${slug}`);
    },
    [onOpenChange, router]
  );

  const handleViewAllResults = useCallback(() => {
    onOpenChange(false);
    router.push(`/productos?search=${encodeURIComponent(debouncedQuery)}`);
    setSearchQuery('');
  }, [debouncedQuery, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-lg">Buscar productos</DialogTitle>
        </DialogHeader>

        <Command className="rounded-none border-none" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Buscar chocolates, dulces, snacks..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-none focus:ring-0"
            />
          </div>

          <CommandList className="max-h-[400px]">
            {/* Loading State */}
            {isLoading && debouncedQuery && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Empty State - No Query */}
            {!debouncedQuery && (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Busca productos por nombre, categoría o marca
                </p>
              </div>
            )}

            {/* Empty State - No Results */}
            {!isLoading && debouncedQuery && products.length === 0 && (
              <CommandEmpty>
                <div className="py-6 px-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    No se encontraron productos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Intenta buscar con otros términos
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* Results */}
            {!isLoading && products.length > 0 && (
              <>
                <CommandGroup heading={`${productsData?.pagination?.totalItems || 0} productos encontrados`}>
                  {products.map((product: ProductParent) => {
                    // Get the first product image
                    const imageUrl = product.images?.[0] || '/placeholder-product.png';

                    return (
                      <CommandItem
                        key={product._id}
                        value={product.slug}
                        onSelect={() => handleSelectProduct(product.slug)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        {/* Product Image */}
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">
                              Ver precios →
                            </p>
                            {product.featured && (
                              <Badge variant="default" className="text-xs">
                                Destacado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                {/* View All Results Link */}
                {productsData?.pagination && productsData.pagination.totalItems > 8 && (
                  <div className="border-t p-3">
                    <button
                      onClick={handleViewAllResults}
                      className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors py-2"
                    >
                      Ver todos los {productsData.pagination.totalItems} resultados →
                    </button>
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
