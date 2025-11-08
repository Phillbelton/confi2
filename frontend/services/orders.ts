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
};

export default orderService;
