import api from '@/lib/axios';
import type {
  DashboardStats,
  SalesData,
  TopProduct,
  RecentOrder,
  LowStockVariant,
} from '@/types/admin';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const adminDashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return data.data;
  },

  /**
   * Get sales data for chart (last 30 days)
   */
  getSalesData: async (days: number = 30): Promise<SalesData[]> => {
    const { data } = await api.get<ApiResponse<SalesData[]>>(`/admin/dashboard/sales-chart`, {
      params: { days },
    });
    return data.data;
  },

  /**
   * Get top selling products
   */
  getTopProducts: async (limit: number = 10): Promise<TopProduct[]> => {
    const { data } = await api.get<ApiResponse<TopProduct[]>>('/admin/dashboard/top-products', {
      params: { limit },
    });
    return data.data;
  },

  /**
   * Get recent orders
   */
  getRecentOrders: async (limit: number = 10): Promise<RecentOrder[]> => {
    const { data } = await api.get<ApiResponse<RecentOrder[]>>('/admin/dashboard/recent-orders', {
      params: { limit },
    });
    return data.data;
  },

  /**
   * Get low stock products
   */
  getLowStockVariants: async (): Promise<LowStockVariant[]> => {
    const { data } = await api.get<LowStockVariant[]>('/products/variants/low-stock');
    return data;
  },
};
