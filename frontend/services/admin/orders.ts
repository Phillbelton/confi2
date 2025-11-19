import api from '@/lib/axios';
import type { AdminPaginatedResponse, AdminPaginationParams } from '@/types/admin';
import type {
  Order,
  OrderFilters,
  UpdateOrderStatusData,
  CancelOrderData,
  UpdateAdminNotesData,
} from '@/types/order';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface GetOrdersParams extends AdminPaginationParams, OrderFilters {}

export const adminOrdersService = {
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

    const { data } = await api.get<ApiResponse<AdminPaginatedResponse<Order>>>('/orders', {
      params: cleanParams,
    });
    return data.data;
  },

  /**
   * Get order by ID
   */
  getOrderById: async (id: string): Promise<Order> => {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return data.data;
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (id: string, statusData: UpdateOrderStatusData): Promise<Order> => {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, statusData);
    return data.data;
  },

  /**
   * Mark WhatsApp as sent
   */
  markWhatsAppSent: async (id: string): Promise<Order> => {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/whatsapp-sent`, {
      whatsappSent: true,
    });
    return data.data;
  },

  /**
   * Cancel order
   */
  cancelOrder: async (id: string, cancelData: CancelOrderData): Promise<Order> => {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`, cancelData);
    return data.data;
  },

  /**
   * Update admin notes
   */
  updateAdminNotes: async (id: string, notesData: UpdateAdminNotesData): Promise<Order> => {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/admin-notes`, notesData);
    return data.data;
  },
};
