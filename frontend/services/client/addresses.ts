import { clientApi } from '@/lib/clientApi';
import type { ApiResponse } from '@/types';

export interface Address {
  _id: string;
  label: string;
  street: string;
  number: string;
  city: string;
  neighborhood?: string;
  reference?: string;
  isDefault: boolean;
}

export interface CreateAddressData {
  label: string;
  street: string;
  number: string;
  city: string;
  neighborhood?: string;
  reference?: string;
  isDefault?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

export const addressService = {
  /**
   * Obtener todas las direcciones del usuario
   */
  getAll: async (): Promise<Address[]> => {
    const { data } = await clientApi.get<ApiResponse<{ addresses: Address[] }>>('/users/me/addresses');
    return (data.data as any)?.addresses || [];
  },

  /**
   * Crear nueva dirección
   */
  create: async (addressData: CreateAddressData): Promise<Address> => {
    const { data } = await clientApi.post<ApiResponse<{ address: Address }>>('/users/me/addresses', addressData);
    return (data.data as any)?.address;
  },

  /**
   * Actualizar dirección
   */
  update: async (id: string, addressData: UpdateAddressData): Promise<Address> => {
    const { data } = await clientApi.put<ApiResponse<{ address: Address }>>(`/users/me/addresses/${id}`, addressData);
    return (data.data as any)?.address;
  },

  /**
   * Eliminar dirección
   */
  delete: async (id: string): Promise<void> => {
    await clientApi.delete(`/users/me/addresses/${id}`);
  },

  /**
   * Marcar como predeterminada
   */
  setDefault: async (id: string): Promise<Address> => {
    const { data } = await clientApi.patch<ApiResponse<{ address: Address }>>(`/users/me/addresses/${id}/default`);
    return (data.data as any)?.address;
  },
};

export default addressService;
