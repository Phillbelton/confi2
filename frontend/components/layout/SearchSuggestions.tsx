'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Package, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  type: 'product' | 'category';
  id: string;
  name: string;
  slug?: string;
  price?: number;
  image?: string;
}

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  query: string;
  onSelect: () => void;
  className?: string;
}

export function SearchSuggestions({
  suggestions,
  isLoading,
  query,
  onSelect,
  className,
}: SearchSuggestionsProps) {
  const router = useRouter();

  const handleProductClick = (slug: string) => {
    router.push(`/productos/${slug}`);
    onSelect();
  };

  const handleViewAll = () => {
    router.push(`/productos?search=${encodeURIComponent(query.trim())}`);
    onSelect();
  };

  if (!query || query.length < 2) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl overflow-hidden z-[100]',
        className
      )}
    >
      {isLoading ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Buscando...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No se encontraron resultados
        </div>
      ) : (
        <>
          {/* Sugerencias de productos */}
          <div className="max-h-[300px] overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() =>
                  suggestion.slug && handleProductClick(suggestion.slug)
                }
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
              >
                {suggestion.image ? (
                  <div className="relative w-10 h-10 flex-shrink-0 bg-muted rounded overflow-hidden">
                    <Image
                      src={suggestion.image}
                      alt={suggestion.name}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 bg-muted rounded flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {suggestion.name}
                  </p>
                  {suggestion.price !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      ${suggestion.price.toLocaleString()}
                    </p>
                  )}
                </div>

                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Ver todos los resultados */}
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-primary border-t border-border"
          >
            <TrendingUp className="h-4 w-4" />
            Ver todos los resultados para "{query}"
          </button>
        </>
      )}
    </div>
  );
}
