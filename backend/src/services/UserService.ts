/**
 * User Service
 *
 * Capa de servicio para gestión de usuarios y direcciones.
 * Contiene toda la lógica de negocio relacionada con users,
 * separada de los controllers.
 */

import { User, IUser, IAddress } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

export interface AddressDTO {
  label: string; // "Casa", "Trabajo", etc.
  street: string;
  number: string;
  city: string;
  neighborhood?: string;
  reference?: string;
  isDefault?: boolean;
}

export class UserService {
  /**
   * Agregar nueva dirección a un usuario
   */
  async addAddress(userId: string, addressData: AddressDTO): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Usar el método del modelo para agregar dirección
    await user.addAddress({
      ...addressData,
      isDefault: addressData.isDefault ?? false,
    });

    return user;
  }

  /**
   * Actualizar dirección existente
   */
  async updateAddress(
    userId: string,
    addressId: string,
    addressData: Partial<AddressDTO>
  ): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Verificar que la dirección existe
    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      throw new AppError(404, 'Dirección no encontrada');
    }

    // Usar el método del modelo para actualizar
    await user.updateAddress(addressId, addressData);

    return user;
  }

  /**
   * Eliminar dirección
   */
  async deleteAddress(userId: string, addressId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Verificar que la dirección existe
    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      throw new AppError(404, 'Dirección no encontrada');
    }

    // Usar el método del modelo para eliminar
    await user.deleteAddress(addressId);

    return user;
  }

  /**
   * Establecer dirección como predeterminada
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // Verificar que la dirección existe
    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      throw new AppError(404, 'Dirección no encontrada');
    }

    // Usar el método del modelo para establecer como default
    await user.setDefaultAddress(addressId);

    return user;
  }

  /**
   * Obtener todas las direcciones de un usuario
   */
  async getUserAddresses(userId: string): Promise<IAddress[]> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    return user.addresses;
  }

  /**
   * Obtener una dirección específica
   */
  async getAddress(userId: string, addressId: string): Promise<IAddress> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      throw new AppError(404, 'Dirección no encontrada');
    }

    return address;
  }

  /**
   * Obtener dirección predeterminada
   */
  async getDefaultAddress(userId: string): Promise<IAddress | null> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const defaultAddress = user.addresses.find((addr) => addr.isDefault);
    return defaultAddress || null;
  }

  /**
   * Listar todos los usuarios (admin)
   */
  async listUsers(filters: {
    role?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ users: IUser[]; total: number }> {
    const query: any = {};

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.active !== undefined) {
      query.active = filters.active;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).select('-password').sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return { users, total };
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    return user;
  }

  /**
   * Activar/desactivar usuario (soft delete)
   */
  async toggleUserStatus(userId: string, active: boolean): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    user.active = active;
    await user.save();

    return user;
  }
}

// Exportar instancia singleton
export const userService = new UserService();
