import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { funcionarioOrdersService } from '@/services/funcionario/orders';
import type {
  OrderFilters,
  UpdateOrderStatusData,
  CancelOrderData,
  EditOrderItemsData,
} from '@/types/order';
import type { AdminPaginationParams } from '@/types/admin';

interface UseOrdersParams extends AdminPaginationParams, OrderFilters {}

export function useFuncionarioOrders(params: UseOrdersParams) {
  const queryClient = useQueryClient();

  // Get orders query
  const ordersQuery = useQuery({
    queryKey: ['funcionario-orders', params],
    queryFn: () => funcionarioOrdersService.getOrders(params),
    staleTime: 1000 * 60 * 1, // 1 minute (más frecuente para funcionarios)
  });

  // Confirm order mutation
  const confirmOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { shippingCost: number; adminNotes?: string } }) =>
      funcionarioOrdersService.confirmOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-orders'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-order'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-stats'] });
      toast.success('Orden confirmada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al confirmar la orden');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusData }) =>
      funcionarioOrdersService.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-orders'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-order'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-stats'] });
      toast.success('Estado de orden actualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el estado');
    },
  });

  // Mark WhatsApp sent mutation
  const markWhatsAppMutation = useMutation({
    mutationFn: ({ id, messageId }: { id: string; messageId?: string }) =>
      funcionarioOrdersService.markWhatsAppSent(id, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-orders'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-order'] });
      toast.success('WhatsApp marcado como enviado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al marcar WhatsApp');
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelOrderData }) =>
      funcionarioOrdersService.cancelOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-orders'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-order'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-stats'] });
      toast.success('Orden cancelada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cancelar la orden');
    },
  });

  // Edit order items mutation
  const editOrderItemsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditOrderItemsData }) =>
      funcionarioOrdersService.editOrderItems(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-orders'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-order'] });
      queryClient.invalidateQueries({ queryKey: ['funcionario-stats'] });
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
    confirmOrder: confirmOrderMutation.mutate,
    isConfirming: confirmOrderMutation.isPending,
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

export function useFuncionarioOrder(id: string) {
  const orderQuery = useQuery({
    queryKey: ['funcionario-order', id],
    queryFn: () => funcionarioOrdersService.getOrderById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    error: orderQuery.error,
    refetch: orderQuery.refetch,
  };
}
