'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { OrderFilters as Filters } from '@/types/order';

interface OrderFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      status: '',
      deliveryMethod: '',
      paymentMethod: '',
      search: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters =
    filters.status ||
    filters.deliveryMethod ||
    filters.paymentMethod ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número de orden, cliente, email..."
          value={filters.search || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value === 'all' ? '' : value as any })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending_whatsapp">Pendiente WhatsApp</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="preparing">En Preparación</SelectItem>
            <SelectItem value="shipped">Enviada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        {/* Delivery Method Filter */}
        <Select
          value={filters.deliveryMethod || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              deliveryMethod: value === 'all' ? '' : value as any,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Método de entrega" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Retiro en tienda</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Method Filter */}
        <Select
          value={filters.paymentMethod || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              paymentMethod: value === 'all' ? '' : value as any,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Date Range (Optional - can be expanded) */}
      {/* <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Fecha desde
          </label>
          <Input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateFrom: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Fecha hasta
          </label>
          <Input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateTo: e.target.value })
            }
          />
        </div>
      </div> */}
    </div>
  );
}
