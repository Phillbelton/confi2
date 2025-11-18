import { api } from '@/lib/axios';
import type { ApiResponse, ApiPaginatedResponse } from '@/types';

export interface StockMovement {
  _id: string;
  variant: string;
  order?: string;
  type: 'sale' | 'restock' | 'adjustment' | 'return' | 'damage';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  notes?: string;
  cost?: number;
  supplier?: string;
  invoiceNumber?: string;
  performedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustStockInput {
  variant: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface RestockInput {
  variant: string;
  quantity: number;
  cost?: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface MovementsQuery {
  page?: number;
  limit?: number;
  type?: 'sale' | 'restock' | 'adjustment' | 'return' | 'damage';
  variant?: string;
  order?: string;
  startDate?: string;
  endDate?: string;
  minQuantity?: number;
  sort?: 'date_asc' | 'date_desc' | 'quantity_asc' | 'quantity_desc';
}

export const stockMovementService = {
  /**
   * Get all stock movements with optional filters
   */
  async getMovements(query: MovementsQuery = {}): Promise<ApiPaginatedResponse<StockMovement[]>> {
    const params = new URLSearchParams();

    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.type) params.append('type', query.type);
    if (query.variant) params.append('variant', query.variant);
    if (query.order) params.append('order', query.order);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.minQuantity !== undefined) params.append('minQuantity', query.minQuantity.toString());
    // Note: Backend doesn't support sort parameter yet, always sorts by createdAt desc

    const queryString = params.toString();
    const url = `/stock-movements${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  /**
   * Get stock movements for a specific variant
   */
  async getVariantMovements(
    variantId: string,
    query: Omit<MovementsQuery, 'variant'> = {}
  ): Promise<ApiPaginatedResponse<StockMovement[]>> {
    const params = new URLSearchParams();

    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.type) params.append('type', query.type);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);

    const queryString = params.toString();
    const url = `/stock-movements/variant/${variantId}${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  /**
   * Get stock movements for a specific order
   */
  async getOrderMovements(orderId: string): Promise<ApiResponse<StockMovement[]>> {
    return api.get(`/stock-movements/order/${orderId}`);
  },

  /**
   * Adjust stock manually (can be positive or negative)
   */
  async adjustStock(data: AdjustStockInput): Promise<ApiResponse<StockMovement>> {
    return api.post('/stock-movements/adjust', data);
  },

  /**
   * Restock product (always positive, with optional supplier info)
   */
  async restockProduct(data: RestockInput): Promise<ApiResponse<StockMovement>> {
    return api.post('/stock-movements/restock', data);
  },
};
