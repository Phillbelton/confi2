import api from '@/lib/axios'; // Public api for login
import adminApi from '@/lib/adminApi'; // Authenticated api for other calls
import type { AdminLoginCredentials, AdminLoginResponse, AdminUser } from '@/types/admin';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const adminAuthService = {
  /**
   * Login admin user (uses public api - no token needed)
   */
  login: async (credentials: AdminLoginCredentials): Promise<AdminLoginResponse> => {
    const { data } = await api.post<ApiResponse<AdminLoginResponse>>('/auth/login', credentials);
    return data.data;
  },

  /**
   * Logout admin user
   */
  logout: async (): Promise<void> => {
    await adminApi.post('/auth/logout');
  },

  /**
   * Get current admin profile
   */
  getProfile: async (): Promise<AdminUser> => {
    const { data } = await adminApi.get<ApiResponse<{ user: AdminUser }>>('/auth/me');
    return data.data.user;
  },

  /**
   * Refresh token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const { data } = await adminApi.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return data.data;
  },
};
