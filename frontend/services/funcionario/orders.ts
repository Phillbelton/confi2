import funcionarioApi from '@/lib/funcionarioApi';
import type { AdminPaginatedResponse, AdminPaginationParams } from '@/types/admin';
import type {
  Order,
  OrderFilters,
  UpdateOrderStatusData,
  CancelOrderData,
  EditOrderItemsData,
} from '@/types/order';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Backend wraps single-order endpoints as { data: { order } }.
type OrderEnvelope = { order: Order };

interface GetOrdersParams extends AdminPaginationParams, OrderFilters {}

interface ConfirmOrderData {
  shippingCost: number;
  adminNotes?: string;
}

export const funcionarioOrdersService = {
  /**
   * Get all orders with pagination and filters
   */
  getOrders: async (params: GetOrdersParams): Promise<AdminPaginatedResponse<Order>> => {
    // Filter out empty string values
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const { data } = await funcionarioApi.get<ApiResponse<AdminPaginatedResponse<Order>>>('/orders', {
      params: cleanParams,
    });
    return data.data;
  },

  /**
   * Get order by ID
   */
  getOrderById: async (id: string): Promise<Order> => {
    const { data } = await funcionarioApi.get<ApiResponse<OrderEnvelope>>(`/orders/${id}`);
    return data.data.order;
  },

  /**
   * Confirm order (set shipping cost and change to confirmed)
   */
  confirmOrder: async (id: string, confirmData: ConfirmOrderData): Promise<Order> => {
    const { data } = await funcionarioApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/confirm`, confirmData);
    return data.data.order;
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (id: string, statusData: UpdateOrderStatusData): Promise<Order> => {
    const { data } = await funcionarioApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/status`, statusData);
    return data.data.order;
  },

  /**
   * Mark WhatsApp as sent
   */
  markWhatsAppSent: async (id: string, messageId?: string): Promise<Order> => {
    const { data } = await funcionarioApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/whatsapp-sent`, {
      messageId,
    });
    return data.data.order;
  },

  /**
   * Cancel order
   */
  cancelOrder: async (id: string, cancelData: CancelOrderData): Promise<Order> => {
    const { data } = await funcionarioApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/cancel`, cancelData);
    return data.data.order;
  },

  /**
   * Edit order items (add, remove, change quantities)
   */
  editOrderItems: async (id: string, itemsData: EditOrderItemsData): Promise<Order> => {
    const { data } = await funcionarioApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/items`, itemsData);
    return data.data.order;
  },

  /**
   * Update shipping cost
   */
  updateShippingCost: async (id: string, shippingCost: number): Promise<Order> => {
    const { data } = await funcionarioApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/shipping`, { shippingCost });
    return data.data.order;
  },

  /**
   * Get stats for dashboard
   */
  getStats: async (startDate?: string, endDate?: string): Promise<any> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await funcionarioApi.get<ApiResponse<any>>('/orders/stats', { params });
    return data.data;
  },
};
