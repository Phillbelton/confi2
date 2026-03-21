import { adminApi } from '@/lib/adminApi';
import type { AdminUser, AdminPaginatedResponse } from '@/types/admin';

export interface UserFilters {
  role?: 'admin' | 'funcionario' | 'cliente' | '';
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'funcionario';
  phone?: string;
  active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'funcionario';
  phone?: string;
  active?: boolean;
}

export const userService = {
  // Obtener usuarios con filtros y paginación
  getUsers: async (filters?: UserFilters): Promise<AdminPaginatedResponse<AdminUser>> => {
    const params: any = {};
    if (filters?.role) params.role = filters.role;
    if (filters?.active !== undefined) params.active = filters.active;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const { data } = await adminApi.get('/users', { params });
    return data.data;
  },

  // Obtener usuario por ID
  getUserById: async (id: string): Promise<AdminUser> => {
    const { data } = await adminApi.get(`/users/${id}`);
    return data.data.user;
  },

  // Crear usuario
  createUser: async (userData: CreateUserData): Promise<AdminUser> => {
    const { data } = await adminApi.post('/users', userData);
    return data.data.user;
  },

  // Actualizar usuario
  updateUser: async (id: string, userData: UpdateUserData): Promise<AdminUser> => {
    const { data } = await adminApi.put(`/users/${id}`, userData);
    return data.data.user;
  },

  // Cambiar contraseña de usuario
  changePassword: async (id: string, newPassword: string): Promise<void> => {
    await adminApi.put(`/users/${id}/password`, { newPassword });
  },

  // Desactivar usuario
  deactivateUser: async (id: string): Promise<void> => {
    await adminApi.delete(`/users/${id}`);
  },

  // Activar usuario
  activateUser: async (id: string): Promise<AdminUser> => {
    const { data } = await adminApi.put(`/users/${id}/activate`);
    return data.data.user;
  },

  // Obtener funcionarios activos
  getFuncionarios: async (): Promise<AdminUser[]> => {
    const { data } = await adminApi.get('/users/funcionarios');
    return data.data.users;
  },
};

export default userService;
