'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ProductQueryParams } from '@/types';

interface ProductFiltersProps {
  filters: ProductQueryParams;
  onFiltersChange: (filters: ProductQueryParams) => void;
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleFeaturedChange = (value: string) => {
    onFiltersChange({
      ...filters,
      featured: value === 'all' ? undefined : value === 'true',
    });
  };

  const handleInStockChange = (value: string) => {
    onFiltersChange({
      ...filters,
      inStock: value === 'all' ? undefined : value === 'true',
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      brands: [],
      featured: undefined,
      inStock: undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.featured !== undefined ||
    filters.inStock !== undefined ||
    (filters.categories && filters.categories.length > 0) ||
    (filters.brands && filters.brands.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <Label>Buscar producto</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Featured Filter */}
        <div>
          <Label>Destacados</Label>
          <Select
            value={
              filters.featured === undefined
                ? 'all'
                : filters.featured
                ? 'true'
                : 'false'
            }
            onValueChange={handleFeaturedChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Solo destacados</SelectItem>
              <SelectItem value="false">No destacados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stock Filter */}
        <div>
          <Label>Stock</Label>
          <Select
            value={
              filters.inStock === undefined
                ? 'all'
                : filters.inStock
                ? 'true'
                : 'false'
            }
            onValueChange={handleInStockChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Con stock</SelectItem>
              <SelectItem value="false">Sin stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
