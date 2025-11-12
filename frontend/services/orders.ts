import { api } from '@/lib/axios';
import type { Order, ApiResponse, CheckoutFormData } from '@/types';

export interface CreateOrderPayload {
  customer: CheckoutFormData;
  items: {
    variantId: string;
    quantity: number;
  }[];
  deliveryMethod: 'pickup' | 'delivery';
  paymentMethod?: 'cash' | 'transfer';
  customerNotes?: string;
}

export interface WhatsAppMessagePayload {
  orderId: string;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const orderService = {
  // Create order (public - for checkout)
  create: async (payload: CreateOrderPayload) => {
    const { data } = await api.post<ApiResponse<Order>>('/orders', payload);
    return data;
  },

  // Generate WhatsApp message
  generateWhatsAppMessage: async (orderId: string) => {
    const { data } = await api.post<ApiResponse<{ message: string; url: string }>>(
      '/orders/whatsapp',
      { orderId }
    );
    return data;
  },

  // Get order by order number (public - for tracking)
  getByOrderNumber: async (orderNumber: string) => {
    const { data } = await api.get<ApiResponse<Order>>(
      `/orders/number/${orderNumber}`
    );
    return data;
  },

  // Get my orders (authenticated customer)
  getMyOrders: async () => {
    const { data } = await api.get<ApiResponse<Order[]>>('/orders/my-orders');
    return data;
  },

  // Get all orders (admin - with pagination and filters)
  getOrders: async (params?: GetOrdersParams) => {
    const { data } = await api.get<ApiResponse<PaginatedOrdersResponse>>('/orders', {
      params,
    });
    return data;
  },

  // Get order by ID (admin)
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return data;
  },

  // Update order status (admin)
  updateStatus: async (id: string, status: string, adminNotes?: string) => {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
      adminNotes,
    });
    return data;
  },

  // Mark WhatsApp as sent (admin)
  markWhatsAppSent: async (id: string) => {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/whatsapp-sent`);
    return data;
  },

  // Cancel order
  cancelOrder: async (id: string, cancellationReason: string) => {
    const { data } = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`, {
      cancellationReason,
    });
    return data;
  },
};

export default orderService;
