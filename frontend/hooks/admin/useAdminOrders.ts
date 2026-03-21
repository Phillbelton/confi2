import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminOrdersService } from '@/services/admin/orders';
import type {
  OrderFilters,
  UpdateOrderStatusData,
  CancelOrderData,
  EditOrderItemsData,
} from '@/types/order';
import type { AdminPaginationParams } from '@/types/admin';

interface UseOrdersParams extends AdminPaginationParams, OrderFilters {}

export function useAdminOrders(params: UseOrdersParams) {
  const queryClient = useQueryClient();

  // Get orders query
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => adminOrdersService.getOrders(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusData }) =>
      adminOrdersService.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Estado de orden actualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el estado');
    },
  });

  // Mark WhatsApp sent mutation
  const markWhatsAppMutation = useMutation({
    mutationFn: (id: string) => adminOrdersService.markWhatsAppSent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      toast.success('WhatsApp marcado como enviado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al marcar WhatsApp');
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelOrderData }) =>
      adminOrdersService.cancelOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Orden cancelada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cancelar la orden');
    },
  });

  // Edit order items mutation
  const editOrderItemsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditOrderItemsData }) =>
      adminOrdersService.editOrderItems(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Orden actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar la orden');
    },
  });

  return {
    orders: ordersQuery.data?.data || [],
    pagination: ordersQuery.data?.pagination,
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    markWhatsAppSent: markWhatsAppMutation.mutate,
    isMarkingWhatsApp: markWhatsAppMutation.isPending,
    cancelOrder: cancelOrderMutation.mutate,
    isCancelling: cancelOrderMutation.isPending,
    editOrderItems: editOrderItemsMutation.mutate,
    isEditingItems: editOrderItemsMutation.isPending,
    refetch: ordersQuery.refetch,
  };
}

export function useAdminOrder(id: string) {
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminOrdersService.getOrderById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    error: orderQuery.error,
    refetch: orderQuery.refetch,
  };
}
