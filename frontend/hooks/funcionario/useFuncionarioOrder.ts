import { useQuery } from '@tanstack/react-query';
import { funcionarioOrdersService } from '@/services/funcionario/orders';

export function useFuncionarioOrder(orderId: string) {
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['funcionario-order', orderId],
    queryFn: () => funcionarioOrdersService.getOrderById(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    order,
    isLoading,
    error,
    refetch,
  };
}
