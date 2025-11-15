// ============================================================================
// CONFITERÍA QUELITA - FRONTEND TYPES
// Aligned with backend models
// ============================================================================

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface VariantAttribute {
  name: string;
  displayName: string;
  order: number;
  values: {
    value: string;
    displayValue: string;
    order: number;
  }[];
}

export interface TieredDiscountTier {
  minQuantity: number;
  maxQuantity: number | null;
  type: 'percentage' | 'amount';
  value: number;
}

export interface TieredDiscount {
  attribute: string;
  attributeValue: string;
  tiers: TieredDiscountTier[];
  startDate?: string;
  endDate?: string;
  badge?: string;
  active: boolean;
}

export interface ProductParent {
  _id: string;
  name: string;
  slug: string;
  description: string;
  categories: string[] | Category[]; // Can be populated or not
  brand?: string | Brand;
  images?: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  variantAttributes: VariantAttribute[];
  tieredDiscounts: TieredDiscount[];
  featured: boolean;
  active: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  hasVariants?: boolean;
}

export interface ProductVariant {
  _id: string;
  parent: string | ProductParent;
  sku: string;
  name?: string; // Optional name field (returned by some API endpoints like low-stock)
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  attributes: {
    [key: string]: string;
  };
  images?: string[];
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  displayName?: string;
}

// ============================================================================
// CATEGORY & BRAND TYPES
// ============================================================================

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  color?: string;
  parent?: string | Category;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  type: 'dietary' | 'feature' | 'origin' | 'occasion' | 'other';
  color?: string;
  icon?: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus =
  | 'pending_whatsapp'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type DeliveryMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'transfer';

export interface OrderCustomer {
  user?: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    city: string;
    postalCode: string;
  };
}

export interface OrderItem {
  variant: string | ProductVariant;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  // Frontend helpers
  productParent?: ProductParent;
  attributes?: { [key: string]: string };
  image?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  totalDiscount: number;
  shippingCost: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentProof?: string;
  status: OrderStatus;
  whatsappSent: boolean;
  whatsappSentAt?: string;
  customerNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'visita' | 'cliente' | 'funcionario' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: {
    street: string;
    number: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CART TYPES (Frontend only)
// ============================================================================

export interface CartItem {
  variantId: string;
  productParent: ProductParent;
  variant: ProductVariant;
  quantity: number;
  // Calculated fields
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  itemCount: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface ProductFilters {
  search?: string;
  categories?: string[];
  brands?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  onSale?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'createdAt' | 'views';
  order: 'asc' | 'desc';
}

export interface ProductQueryParams extends ProductFilters {
  page?: number;
  limit?: number;
  sort?: string; // "price:asc" | "createdAt:desc" etc
}

// ============================================================================
// DISCOUNT CALCULATION HELPERS
// ============================================================================

export interface DiscountCalculation {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  appliedTier?: TieredDiscountTier;
  badge?: string;
}

export interface TieredDiscountPreview {
  attribute: string;
  attributeValue: string;
  tiers: {
    minQuantity: number;
    maxQuantity: number | null;
    discountedPrice: number;
    savings: number;
    savingsPercentage: number;
  }[];
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CheckoutFormData {
  // Step 1: Contact info
  name: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    number: string;
    city: string;
    postalCode: string;
  };
  notes?: string;

  // Step 2: Delivery
  deliveryMethod: DeliveryMethod;

  // Step 3: Payment (after WhatsApp)
  paymentMethod?: PaymentMethod;
}

// ============================================================================
// COMPONENT PROPS HELPERS
// ============================================================================

export interface ProductCardProps {
  product: ProductParent;
  variant?: ProductVariant;
  compact?: boolean;
  showQuickAdd?: boolean;
}

export interface FilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  categories: Category[];
  brands: Brand[];
  tags: Tag[];
}

// ============================================================================
// STATS & ANALYTICS (Admin)
// ============================================================================

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  totalOrders: number;
  completedOrders: number;
  salesThisMonth: number;
}
