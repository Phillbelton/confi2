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
  product: string;
  /** Presentación comprada. Con `product` forma la identidad de la línea. */
  presentationId?: string;
  productSnapshot: {
    name: string;
    slug: string;
    barcode?: string;
    unitPrice: number;
    saleUnit: { type: string; quantity: number };
    image: string;
    /** Escalera de precios congelada al comprar (para reeditar respetando lo pactado). */
    tiers?: { minQuantity: number; pricePerUnit: number }[];
    fixedDiscount?: {
      enabled?: boolean;
      type?: string;
      value?: number;
      startDate?: string;
      endDate?: string;
    } | null;
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

export interface EditOrderLine {
  productId: string;
  /** Presentación elegida. Ausente = la principal del producto. */
  presentationId?: string;
  /** Al editar, 0 quita la línea. */
  quantity: number;
}

export interface EditOrderItemsData {
  items: EditOrderLine[];
  adminNotes?: string;
}

/** Un cambio detectado por el preview, para explicarle al operador qué pasa. */
export interface OrderEditChange {
  name: string;
  kind: 'added' | 'removed' | 'quantity' | 'price';
  before?: number;
  after?: number;
}

/** Respuesta del preview de edición: cómo quedaría el pedido, sin guardar. */
export interface OrderEditPreview {
  items: OrderItem[];
  subtotal: number;
  totalDiscount: number;
  shippingCost: number;
  total: number;
  previousTotal: number;
  difference: number;
  changes: OrderEditChange[];
  isEmpty: boolean;
  warnings: string[];
}
