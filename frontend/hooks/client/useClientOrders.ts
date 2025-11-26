'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderService } from '@/services/orders';
import type { Order, OrderStatus } from '@/types/order';

export interface OrderFilters {
  status?: OrderStatus | '';
  page?: number;
  limit?: number;
}

/**
 * Hook para obtener las órdenes del cliente
 */
export function useMyOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['my-orders', filters],
    queryFn: () => orderService.getMyOrders(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener detalle de una orden por número
 */
export function useOrderDetail(orderNumber: string) {
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => orderService.getByOrderNumber(orderNumber),
    enabled: !!orderNumber,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para cancelar una orden (solo si está en pending_whatsapp)
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      // Este endpoint necesitaría ser implementado o usar uno existente
      // Por ahora asumimos que existe un endpoint de cancelación para clientes
      throw new Error('Endpoint de cancelación no implementado para clientes');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('Pedido cancelado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'No se pudo cancelar el pedido');
    },
  });
}

/**
 * Utilidad para verificar si una orden puede ser cancelada
 */
export function canCancelOrder(order: Order): boolean {
  return order.status === 'pending_whatsapp';
}

/**
 * Utilidad para verificar si una orden puede ser repetida
 */
export function canReorderOrder(order: Order): boolean {
  return order.items.length > 0;
}

/**
 * Configuración de colores y labels para estados
 */
export const orderStatusConfig: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  pending_whatsapp: {
    label: 'Pendiente',
    color: 'warning',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
  },
  confirmed: {
    label: 'Confirmado',
    color: 'info',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  preparing: {
    label: 'Preparando',
    color: 'info',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-800',
  },
  shipped: {
    label: 'En camino',
    color: 'info',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
  },
  completed: {
    label: 'Completado',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'error',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

export function getOrderStatusConfig(status: OrderStatus) {
  return orderStatusConfig[status] || orderStatusConfig.pending_whatsapp;
}
