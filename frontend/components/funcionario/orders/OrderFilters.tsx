'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { OrderStatus } from '@/types/order';

interface OrderFiltersProps {
  filters: {
    status?: OrderStatus | '';
    deliveryMethod?: 'pickup' | 'delivery' | '';
    paymentMethod?: 'cash' | 'transfer' | '';
    search?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function OrderFilters({ filters, onFilterChange, onClearFilters }: OrderFiltersProps) {
  const hasActiveFilters =
    filters.status || filters.deliveryMethod || filters.paymentMethod || filters.search;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por número, cliente, teléfono..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="pl-10 bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFilterChange('status', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-600 text-slate-200">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending_whatsapp">🟡 Pendiente WhatsApp</SelectItem>
            <SelectItem value="confirmed">🔵 Confirmada</SelectItem>
            <SelectItem value="preparing">🟣 En Preparación</SelectItem>
            <SelectItem value="shipped">🟦 Enviada</SelectItem>
            <SelectItem value="completed">🟢 Completada</SelectItem>
            <SelectItem value="cancelled">🔴 Cancelada</SelectItem>
          </SelectContent>
        </Select>

        {/* Delivery Method Filter */}
        <Select
          value={filters.deliveryMethod || 'all'}
          onValueChange={(value) => onFilterChange('deliveryMethod', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-600 text-slate-200">
            <SelectValue placeholder="Método de entrega" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="delivery">🚚 Delivery</SelectItem>
            <SelectItem value="pickup">📦 Retiro</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Method Filter */}
        <Select
          value={filters.paymentMethod || 'all'}
          onValueChange={(value) => onFilterChange('paymentMethod', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-600 text-slate-200">
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="cash">💵 Efectivo</SelectItem>
            <SelectItem value="transfer">💳 Transferencia</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
