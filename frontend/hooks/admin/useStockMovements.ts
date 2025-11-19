import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  stockMovementService,
  type MovementsQuery,
  type AdjustStockInput,
  type RestockInput
} from '@/services/admin/stockMovements';

/**
 * Hook for fetching all stock movements with filters
 */
export function useStockMovements(query: MovementsQuery = {}) {
  return useQuery({
    queryKey: ['stock-movements', query],
    queryFn: () => stockMovementService.getMovements(query),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for fetching stock movements of a specific variant
 */
export function useVariantMovements(variantId: string, query: Omit<MovementsQuery, 'variant'> = {}) {
  return useQuery({
    queryKey: ['stock-movements', 'variant', variantId, query],
    queryFn: () => stockMovementService.getVariantMovements(variantId, query),
    enabled: !!variantId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for fetching stock movements of a specific order
 */
export function useOrderMovements(orderId: string) {
  return useQuery({
    queryKey: ['stock-movements', 'order', orderId],
    queryFn: () => stockMovementService.getOrderMovements(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for stock adjustment and restock operations
 */
export function useStockOperations() {
  const queryClient = useQueryClient();

  const adjustStockMutation = useMutation({
    mutationFn: (data: AdjustStockInput) => stockMovementService.adjustStock(data),
    onSuccess: (response) => {
      toast.success('Stock ajustado correctamente', {
        description: `Nuevo stock: ${response.data.newStock} unidades`,
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-variants'] });
      queryClient.invalidateQueries({ queryKey: ['out-stock-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] });
    },
    onError: (error: any) => {
      toast.error('Error al ajustar stock', {
        description: error.response?.data?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  const restockMutation = useMutation({
    mutationFn: (data: RestockInput) => stockMovementService.restockProduct(data),
    onSuccess: (response) => {
      toast.success('Restock realizado correctamente', {
        description: `Se agregaron ${response.data.quantity} unidades`,
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-variants'] });
      queryClient.invalidateQueries({ queryKey: ['out-stock-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] });
    },
    onError: (error: any) => {
      toast.error('Error al reabastecer', {
        description: error.response?.data?.message || 'Ocurrió un error inesperado',
      });
    },
  });

  return {
    adjustStock: adjustStockMutation.mutate,
    isAdjusting: adjustStockMutation.isPending,
    restock: restockMutation.mutate,
    isRestocking: restockMutation.isPending,
  };
}
