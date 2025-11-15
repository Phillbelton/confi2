// Order types for admin panel

export type OrderStatus =
  | 'pending_whatsapp'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type DeliveryMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'transfer';

export interface OrderItem {
  variant: string;
  variantSnapshot: {
    sku: string;
    name: string;
    price: number;
    attributes: { [key: string]: string };
    image: string;
  };
  quantity: number;
  pricePerUnit: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;

  // Customer
  customer: {
    user?: string;
    name: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      number: string;
      city: string;
      neighborhood?: string;
      reference?: string;
    };
  };

  // Delivery notes
  deliveryNotes?: string;

  // Items
  items: OrderItem[];

  // Amounts
  subtotal: number;
  totalDiscount: number;
  shippingCost: number;
  total: number;

  // Delivery and payment
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentProof?: string;

  // Status
  status: OrderStatus;

  // WhatsApp tracking
  whatsappSent: boolean;
  whatsappSentAt?: string;
  whatsappMessageId?: string;

  // Notes
  customerNotes?: string;
  adminNotes?: string;

  // Cancellation
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // Audit
  createdBy?: string;
  updatedBy?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
}

export interface OrderFilters {
  status?: OrderStatus | '';
  deliveryMethod?: DeliveryMethod | '';
  paymentMethod?: PaymentMethod | '';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
  adminNotes?: string;
}

export interface CancelOrderData {
  cancellationReason: string;
  adminNotes?: string;
}

export interface UpdateAdminNotesData {
  adminNotes: string;
}
