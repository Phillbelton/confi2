import { api } from '@/lib/axios'; // Public api for login/register
import { clientApi } from '@/lib/clientApi'; // Authenticated api for profile/logout
import type { ApiResponse } from '@/types';
import type { ClientUser } from '@/store/useClientStore';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: ClientUser;
  token: string;
}

export const clientAuthService = {
  /**
   * Login cliente (public api - no auth needed)
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);

    // Store token for client
    if (data.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('client-token', data.data.token);
    }

    return data.data as AuthResponse;
  },

  /**
   * Registro cliente (public api - no auth needed)
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      ...userData,
      role: 'cliente',
    });

    // Store token for client
    if (data.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('client-token', data.data.token);
    }

    return data.data as AuthResponse;
  },

  /**
   * Logout (authenticated)
   */
  logout: async (): Promise<void> => {
    try {
      await clientApi.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('client-token');
      }
    }
  },

  /**
   * Obtener perfil actual (authenticated)
   */
  getProfile: async (): Promise<ClientUser> => {
    const { data } = await clientApi.get<ApiResponse<{ user: ClientUser }>>('/auth/me');
    return (data.data as any)?.user;
  },

  /**
   * Actualizar perfil (authenticated)
   */
  updateProfile: async (profileData: UpdateProfileData): Promise<ClientUser> => {
    const { data } = await clientApi.put<ApiResponse<{ user: ClientUser }>>('/auth/me', profileData);
    return (data.data as any)?.user;
  },

  /**
   * Cambiar contraseña (authenticated)
   */
  changePassword: async (passwordData: ChangePasswordData): Promise<void> => {
    await clientApi.put('/auth/change-password', passwordData);
  },

  /**
   * Solicitar reseteo de contraseña (public api)
   */
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  /**
   * Resetear contraseña con token (public api)
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post(`/auth/reset-password/${token}`, { newPassword });
  },
};

export default clientAuthService;
