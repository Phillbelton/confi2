import { useState, useEffect, useRef } from 'react';
import { productService } from '@/services/products';
import type { ProductParent, Category } from '@/types';

interface SearchSuggestion {
  type: 'product' | 'category';
  id: string;
  name: string;
  slug?: string;
  price?: number;
  image?: string;
}

interface UseSearchSuggestionsResult {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
}

// Cache simple en memoria
const searchCache = new Map<string, SearchSuggestion[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const cacheTimestamps = new Map<string, number>();

export function useSearchSuggestions(
  query: string,
  enabled: boolean = true,
  debounceMs: number = 300
): UseSearchSuggestionsResult {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si no está habilitado o query muy corto, limpiar
    if (!enabled || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce
    debounceTimerRef.current = setTimeout(async () => {
      const trimmedQuery = query.trim().toLowerCase();

      // Verificar cache
      const cached = searchCache.get(trimmedQuery);
      const cacheTime = cacheTimestamps.get(trimmedQuery);

      if (cached && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
        setSuggestions(cached);
        setIsLoading(false);
        return;
      }

      // Crear nuevo AbortController para esta búsqueda
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        // Búsqueda ligera: solo primeros 6 productos
        const response = await productService.getProducts({
          search: trimmedQuery,
          limit: 6,
          page: 1,
        });

        const products = response.data || [];

        // Convertir a sugerencias
        const productSuggestions: SearchSuggestion[] = products.map((product: ProductParent) => ({
          type: 'product' as const,
          id: product._id,
          name: product.name,
          slug: product.slug,
          // ProductParent no tiene precio directo, lo tiene en las variantes
          price: undefined,
          image: product.images?.[0],
        }));

        // Guardar en cache
        searchCache.set(trimmedQuery, productSuggestions);
        cacheTimestamps.set(trimmedQuery, Date.now());

        setSuggestions(productSuggestions);
        setError(null);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Error al buscar sugerencias');
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, enabled, debounceMs]);

  return { suggestions, isLoading, error };
}
