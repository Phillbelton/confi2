import { useQuery } from '@tanstack/react-query';
import { funcionarioOrdersService } from '@/services/funcionario/orders';
import { startOfToday, endOfToday, startOfYesterday, endOfYesterday } from 'date-fns';

export function useFuncionarioDashboard() {
  const today = startOfToday();
  const todayEnd = endOfToday();
  const yesterday = startOfYesterday();
  const yesterdayEnd = endOfYesterday();

  // Get orders from today
  const todayOrdersQuery = useQuery({
    queryKey: ['funcionario-orders-today'],
    queryFn: () =>
      funcionarioOrdersService.getOrders({
        startDate: today.toISOString(),
        endDate: todayEnd.toISOString(),
        page: 1,
        limit: 100, // Get all today's orders
      }),
    staleTime: 1000 * 30, // 30 seconds (refresh frequently)
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  });

  // Get pending orders (pending_whatsapp status)
  const pendingOrdersQuery = useQuery({
    queryKey: ['funcionario-orders-pending'],
    queryFn: () =>
      funcionarioOrdersService.getOrders({
        status: 'pending_whatsapp',
        page: 1,
        limit: 100,
      }),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  });

  // Get recent orders for the list (last 5)
  const recentOrdersQuery = useQuery({
    queryKey: ['funcionario-orders-recent'],
    queryFn: () =>
      funcionarioOrdersService.getOrders({
        page: 1,
        limit: 5,
      }),
    staleTime: 1000 * 30, // 30 seconds
  });

  // Calculate stats
  const todayOrders = todayOrdersQuery.data?.data || [];
  const pendingOrders = pendingOrdersQuery.data?.data || [];

  const stats = {
    nuevasOrdenes: todayOrders.filter((o) => o.status === 'pending_whatsapp').length,
    porConfirmar: pendingOrders.length,
    completadasHoy: todayOrders.filter((o) => o.status === 'completed').length,
    ventasDelDia: todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0),
  };

  return {
    stats,
    isLoadingStats: todayOrdersQuery.isLoading || pendingOrdersQuery.isLoading,
    recentOrders: recentOrdersQuery.data?.data || [],
    isLoadingRecentOrders: recentOrdersQuery.isLoading,
    refetch: () => {
      todayOrdersQuery.refetch();
      pendingOrdersQuery.refetch();
      recentOrdersQuery.refetch();
    },
  };
}
