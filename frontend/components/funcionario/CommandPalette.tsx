'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  Home,
  Package,
  Clock,
  CheckCircle,
  BarChart3,
  User,
  FileText,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Order } from '@/types/order';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Quick navigation items
  const quickNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Vista principal',
      icon: Home,
      onSelect: () => router.push('/funcionario'),
    },
    {
      id: 'all-orders',
      label: 'Todas las Órdenes',
      description: 'Lista completa de órdenes',
      icon: Package,
      onSelect: () => router.push('/funcionario/ordenes'),
    },
    {
      id: 'pending-orders',
      label: 'Órdenes Pendientes',
      description: 'Órdenes esperando confirmación',
      icon: Clock,
      onSelect: () => router.push('/funcionario/ordenes/pendientes'),
    },
    {
      id: 'stats',
      label: 'Estadísticas',
      description: 'Ver estadísticas y métricas',
      icon: BarChart3,
      onSelect: () => router.push('/funcionario/estadisticas'),
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      description: 'Configuración de perfil',
      icon: User,
      onSelect: () => router.push('/funcionario/perfil'),
    },
  ];

  // Search orders when user types
  useEffect(() => {
    const searchOrders = async () => {
      if (search.length < 2) {
        setOrders([]);
        return;
      }

      setIsSearching(true);
      try {
        // Search by order number or customer name
        const response = await fetch(
          `/api/funcionario/orders?search=${encodeURIComponent(search)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setOrders(data.data || []);
        }
      } catch (error) {
        console.error('Error searching orders:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchOrders, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleSelect = useCallback(
    (callback: () => void) => {
      callback();
      onOpenChange(false);
      setSearch('');
      setOrders([]);
    },
    [onOpenChange]
  );

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch('');
      setOrders([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-[640px]">
        <Command className="rounded-lg border shadow-md">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar órdenes por número o cliente..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            )}
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              {search.length < 2
                ? 'Escribe al menos 2 caracteres para buscar órdenes'
                : 'No se encontraron resultados'}
            </Command.Empty>

            {/* Quick Navigation */}
            {search.length < 2 && (
              <Command.Group heading="Navegación Rápida">
                {quickNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={item.label}
                      onSelect={() => handleSelect(item.onSelect)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {/* Order Results */}
            {orders.length > 0 && (
              <Command.Group heading="Órdenes Encontradas">
                {orders.map((order) => (
                  <Command.Item
                    key={order._id}
                    value={`${order.orderNumber} ${order.customer.name}`}
                    onSelect={() =>
                      handleSelect(() => router.push(`/funcionario/ordenes/${order._id}`))
                    }
                    className="flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                  >
                    <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-mono font-semibold">
                          {order.orderNumber}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getStatusColor(order.status)
                          )}
                        >
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {order.customer.name} • {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.items.length} producto{order.items.length !== 1 ? 's' : ''} •{' '}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Hint */}
          <div className="border-t px-3 py-2 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Navega con <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">↓</kbd>
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">Enter</kbd> para
              seleccionar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">Esc</kbd> para
              cerrar
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_whatsapp: 'Pendiente',
    confirmed: 'Confirmada',
    preparing: 'Preparando',
    shipped: 'Enviada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_whatsapp: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || '';
}

function formatCurrency(value: number): string {
  return '$' + new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
