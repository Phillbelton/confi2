import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// Extender el Request de Express para incluir usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'cliente' | 'funcionario' | 'admin';
  };
}

// JWT Payload personalizado
export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: 'cliente' | 'funcionario' | 'admin';
}

// Response estándar de API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Tipos de descuento
export type DiscountType = 'percentage' | 'amount';

export interface FixedDiscount {
  enabled: boolean;
  type: DiscountType;
  value: number;
  startDate?: Date;
  endDate?: Date;
  badge?: string;
}

export interface TieredDiscountTier {
  minQuantity: number;
  maxQuantity?: number;
  type: DiscountType;
  value: number;
}

export interface TieredDiscount {
  enabled: boolean;
  tiers: TieredDiscountTier[];
}

export interface ProductDiscount {
  fixed?: FixedDiscount;
  tiered?: TieredDiscount;
}

// Estado de orden
export type OrderStatus =
  | 'pending_whatsapp'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

// Método de entrega
export type DeliveryMethod = 'pickup' | 'delivery';

// Método de pago
export type PaymentMethod = 'cash' | 'transfer';

// Roles de usuario
export type UserRole = 'cliente' | 'funcionario' | 'admin';

// Query params para paginación
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Query params para filtros de productos
export interface ProductFilters extends PaginationQuery {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

// Query params para filtros de órdenes
export interface OrderFilters extends PaginationQuery {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Resultado paginado
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Alias para compatibilidad
export type PaginatedResponse<T> = PaginatedResult<T>;
