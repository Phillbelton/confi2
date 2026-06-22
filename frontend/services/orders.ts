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
    productId: string;
    presentationId?: string;
    quantity: number;
  }[];
  deliveryMethod: 'pickup' | 'delivery';
  paymentMethod?: 'cash' | 'transfer';
  customerNotes?: string;
}

export const orderService = {
  // Crea la orden (usa clientApi para mandar el token si el usuario está logueado).
  //
  // El backend (`createOrder`) responde { success, data: { order } } y NO
  // incluye `whatsappURL`: el link de WhatsApp se arma siempre en el cliente
  // con NEXT_PUBLIC_WHATSAPP_NUMBER (ver app/pedido/[orderNumber] y
  // app/(cliente)/mis-ordenes/[orderNumber]). Decisión 2026-06-16: no
  // tipamos un `whatsappURL` que el backend nunca manda. El generador rico de
  // mensajes (backend/src/services/whatsappService.ts) queda disponible para
  // un futuro flujo deliberado de "enviar el pedido completo al negocio".
  create: async (payload: CreateOrderPayload) => {
    const { data } = await clientApi.post<ApiResponse<{ order: Order }>>('/orders', payload);
    return data.data;
  },

  // Get order by order number (authenticated - admin/funcionario or owner client)
  getByOrderNumber: async (orderNumber: string) => {
    const { data } = await clientApi.get<ApiResponse<{ order: Order }>>(
      `/orders/number/${orderNumber}`
    );
    // Backend returns { success: true, data: { order: {...} } }
    return data.data?.order;
  },

  // Get my orders (authenticated customer - uses clientApi)
  getMyOrders: async () => {
    const { data } = await clientApi.get<ApiResponse<{ orders: Order[] }>>('/orders/my-orders');
    // Backend returns { success: true, data: { orders: [...] } }
    // Frontend espera { data: [...] } por compat con código existente
    const orders = data.data?.orders || [];
    return { data: orders, pagination: { total: orders.length, page: 1, totalPages: 1 } };
  },
};

export default orderService;
