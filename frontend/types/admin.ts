// Admin-specific TypeScript types

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'funcionario' | 'cliente';
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalProducts: number;
  totalCustomers: number;
  weekSales: number;
  monthSales: number;
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  _id: string;
  name: string;
  image?: string;
  totalSold: number;
  revenue: number;
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

export interface LowStockVariant {
  _id: string;
  sku: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  parent: {
    _id: string;
    name: string;
  };
}

export interface AdminPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminFilters {
  active?: boolean;
  category?: string;
  brand?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}
