import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';

export interface OrderStats {
  _id: string; // status
  count: number;
  total: number;
}

export interface DashboardStats {
  stats: OrderStats[];
}

export const dashboardService = {
  // Get order statistics
  getOrderStats: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await api.get<ApiResponse<DashboardStats>>('/orders/stats', {
      params,
    });
    return data;
  },
};

export default dashboardService;
