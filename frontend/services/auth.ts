import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cliente';
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return data;
  },

  // Register (for customers)
  register: async (registerData: RegisterData) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      registerData
    );
    return data;
  },

  // Logout
  logout: async () => {
    const { data } = await api.post<ApiResponse<void>>('/auth/logout');
    return data;
  },

  // Get current user
  getMe: async () => {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return data;
  },

  // Refresh token
  refreshToken: async () => {
    const { data } = await api.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return data;
  },
};

export default authService;
