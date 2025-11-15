import api from '@/lib/axios';
import type { AdminLoginCredentials, AdminLoginResponse, AdminUser } from '@/types/admin';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const adminAuthService = {
  /**
   * Login admin user
   */
  login: async (credentials: AdminLoginCredentials): Promise<AdminLoginResponse> => {
    const { data } = await api.post<ApiResponse<AdminLoginResponse>>('/auth/login', credentials);
    return data.data;
  },

  /**
   * Logout admin user
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Get current admin profile
   */
  getProfile: async (): Promise<AdminUser> => {
    const { data } = await api.get<ApiResponse<{ user: AdminUser }>>('/auth/me');
    return data.data.user;
  },

  /**
   * Refresh token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const { data } = await api.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return data.data;
  },
};
