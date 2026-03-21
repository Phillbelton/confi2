import { useQuery } from '@tanstack/react-query';
import { adminDashboardService } from '@/services/admin/dashboard';

export function useAdminDashboard() {
  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminDashboardService.getStats,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const salesDataQuery = useQuery({
    queryKey: ['admin-sales-chart', 30],
    queryFn: () => adminDashboardService.getSalesData(30),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const topProductsQuery = useQuery({
    queryKey: ['admin-top-products', 10],
    queryFn: () => adminDashboardService.getTopProducts(10),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const recentOrdersQuery = useQuery({
    queryKey: ['admin-recent-orders', 10],
    queryFn: () => adminDashboardService.getRecentOrders(10),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const lowStockQuery = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: adminDashboardService.getLowStockVariants,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    salesData: salesDataQuery.data,
    isLoadingSalesData: salesDataQuery.isLoading,
    topProducts: topProductsQuery.data,
    isLoadingTopProducts: topProductsQuery.isLoading,
    recentOrders: recentOrdersQuery.data,
    isLoadingRecentOrders: recentOrdersQuery.isLoading,
    lowStock: lowStockQuery.data,
    isLoadingLowStock: lowStockQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      salesDataQuery.refetch();
      topProductsQuery.refetch();
      recentOrdersQuery.refetch();
      lowStockQuery.refetch();
    },
  };
}
