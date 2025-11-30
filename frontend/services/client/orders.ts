import clientApi from '@/lib/clientApi';
import type { Order } from '@/types/order';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const clientOrdersService = {
  /**
   * Get all orders for the authenticated client
   */
  getOrders: async (): Promise<Order[]> => {
    const { data } = await clientApi.get<ApiResponse<Order[]>>('/orders/my-orders');
    return data.data;
  },

  /**
   * Get order by order number
   */
  getOrderByNumber: async (orderNumber: string): Promise<Order> => {
    const { data } = await clientApi.get<ApiResponse<Order>>(`/orders/order/${orderNumber}`);
    return data.data;
  },

  /**
   * Cancel order
   */
  cancelOrder: async (orderId: string, cancellationReason: string): Promise<Order> => {
    const { data } = await clientApi.put<ApiResponse<Order>>(`/orders/${orderId}/cancel`, {
      cancellationReason,
    });
    return data.data;
  },
};
