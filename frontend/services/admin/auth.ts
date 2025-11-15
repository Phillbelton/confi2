import api from '@/lib/axios';
import type { AdminLoginCredentials, AdminLoginResponse, AdminUser } from '@/types/admin';

export const adminAuthService = {
  /**
   * Login admin user
   */
  login: async (credentials: AdminLoginCredentials): Promise<AdminLoginResponse> => {
    const { data } = await api.post<AdminLoginResponse>('/auth/login', credentials);
    return data;
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
    const { data } = await api.get<AdminUser>('/auth/profile');
    return data;
  },

  /**
   * Refresh token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const { data } = await api.post<{ token: string }>('/auth/refresh-token');
    return data;
  },
};
