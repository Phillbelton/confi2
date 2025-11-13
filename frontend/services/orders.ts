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
    const { data } = await api.post<ApiResponse<{ order: Order; whatsappURL: string }>>('/orders', payload);
    // Backend returns { success: true, data: { order: {...}, whatsappURL: '...' } }
    return data.data as any;
  },

  // Generate WhatsApp message
  generateWhatsAppMessage: async (orderId: string) => {
    const { data } = await api.post<ApiResponse<{ message: string; url: string }>>(
      '/orders/whatsapp',
      { orderId }
    );
    // Backend returns { success: true, data: { message: '...', url: '...' } }
    return data.data as any;
  },

  // Get order by order number (public - for tracking)
  getByOrderNumber: async (orderNumber: string) => {
    const { data } = await api.get<ApiResponse<{ order: Order }>>(
      `/orders/number/${orderNumber}`
    );
    // Backend returns { success: true, data: { order: {...} } }
    return (data.data as any)?.order;
  },

  // Get my orders (authenticated customer)
  getMyOrders: async () => {
    const { data } = await api.get<ApiResponse<{ data: Order[]; pagination: any }>>('/orders/my-orders');
    // Backend returns { success: true, data: { data: [...], pagination: {...} } }
    return data.data as any;
  },
};

export default orderService;
