import { api } from '@/lib/axios';
import { clientApi } from '@/lib/clientApi';
import type { Order, ApiResponse } from '@/types';

export interface CreateOrderPayload {
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: {
      street: string;
      number: string;
      city: string;
      neighborhood?: string;
      reference?: string;
    };
  };
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

export interface ValidateCartPayload {
  items: {
    variantId: string;
    quantity: number;
    finalPrice: number;
    subtotal: number;
  }[];
}

export interface ValidateCartResponse {
  valid: boolean;
  discrepancies?: Array<{
    variantId: string;
    frontend: { finalPrice: number; subtotal: number };
    server: { finalPrice: number; subtotal: number };
  }>;
  serverPrices?: Array<{
    variantId: string;
    quantity: number;
    originalPrice: number;
    finalPricePerUnit: number;
    totalDiscount: number;
    subtotal: number;
  }>;
  items?: Array<{
    variantId: string;
    quantity: number;
    originalPrice: number;
    finalPricePerUnit: number;
    totalDiscount: number;
    subtotal: number;
  }>;
}

export const orderService = {
  // Validate cart prices with server (anti-fraud)
  validateCart: async (payload: ValidateCartPayload) => {
    const { data } = await api.post<ApiResponse<ValidateCartResponse>>('/orders/validate-cart', payload);
    // Backend returns { success: true, data: { valid: true, items: [...] } }
    // or { success: false, data: { valid: false, discrepancies: [...], serverPrices: [...] } }
    return data.data as ValidateCartResponse;
  },

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

  // Get my orders (authenticated customer - uses clientApi)
  getMyOrders: async () => {
    const { data } = await clientApi.get<ApiResponse<{ data: Order[]; pagination: any }>>('/orders/my-orders');
    // Backend returns { success: true, data: { data: [...], pagination: {...} } }
    return data.data as any;
  },
};

export default orderService;
