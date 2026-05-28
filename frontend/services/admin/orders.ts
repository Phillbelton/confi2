import adminApi from '@/lib/adminApi';
import type { AdminPaginatedResponse, AdminPaginationParams } from '@/types/admin';
import type {
  Order,
  OrderFilters,
  UpdateOrderStatusData,
  CancelOrderData,
  UpdateAdminNotesData,
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

export const adminOrdersService = {
  /**
   * Get all orders with pagination and filters
   */
  getOrders: async (params: GetOrdersParams): Promise<AdminPaginatedResponse<Order>> => {
    // Filter out empty string / null / undefined values
    const cleanParams: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== null && value !== undefined) {
        cleanParams[key] = value;
      }
    }

    const { data } = await adminApi.get<ApiResponse<AdminPaginatedResponse<Order>>>('/orders', {
      params: cleanParams,
    });
    return data.data;
  },

  /**
   * Get order by ID
   */
  getOrderById: async (id: string): Promise<Order> => {
    const { data } = await adminApi.get<ApiResponse<OrderEnvelope>>(`/orders/${id}`);
    return data.data.order;
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (id: string, statusData: UpdateOrderStatusData): Promise<Order> => {
    const { data } = await adminApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/status`, statusData);
    return data.data.order;
  },

  /**
   * Mark WhatsApp as sent
   */
  markWhatsAppSent: async (id: string): Promise<Order> => {
    const { data } = await adminApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/whatsapp-sent`, {
      whatsappSent: true,
    });
    return data.data.order;
  },

  /**
   * Cancel order
   */
  cancelOrder: async (id: string, cancelData: CancelOrderData): Promise<Order> => {
    const { data } = await adminApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/cancel`, cancelData);
    return data.data.order;
  },

  /**
   * Update admin notes
   */
  updateAdminNotes: async (id: string, notesData: UpdateAdminNotesData): Promise<Order> => {
    const { data } = await adminApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/admin-notes`, notesData);
    return data.data.order;
  },

  /**
   * Edit order items (add, remove, change quantities)
   */
  editOrderItems: async (id: string, itemsData: EditOrderItemsData): Promise<Order> => {
    const { data } = await adminApi.put<ApiResponse<OrderEnvelope>>(`/orders/${id}/items`, itemsData);
    return data.data.order;
  },
};
