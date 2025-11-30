import api from '@/lib/axios'; // Public api for login
import funcionarioApi from '@/lib/funcionarioApi'; // Authenticated api for other calls
import type { AdminLoginCredentials, AdminLoginResponse, AdminUser } from '@/types/admin';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const funcionarioAuthService = {
  /**
   * Login funcionario user (uses public api - no token needed)
   */
  login: async (credentials: AdminLoginCredentials): Promise<AdminLoginResponse> => {
    const { data } = await api.post<ApiResponse<AdminLoginResponse>>('/auth/login', credentials);
    return data.data;
  },

  /**
   * Logout funcionario user
   */
  logout: async (): Promise<void> => {
    await funcionarioApi.post('/auth/logout');
  },

  /**
   * Get current funcionario profile
   */
  getProfile: async (): Promise<AdminUser> => {
    const { data } = await funcionarioApi.get<ApiResponse<{ user: AdminUser }>>('/auth/me');
    return data.data.user;
  },

  /**
   * Refresh token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const { data} = await funcionarioApi.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return data.data;
  },
};
