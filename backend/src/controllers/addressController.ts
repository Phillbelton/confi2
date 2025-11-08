import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/asyncHandler';

/**
 * @desc    Obtener todas las direcciones del usuario
 * @route   GET /api/users/me/addresses
 * @access  Private
 */
export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError(401, 'Usuario no autenticado'));
  }

  const user = await User.findById(userId).select('addresses');

  if (!user) {
    return next(new AppError(404, 'Usuario no encontrado'));
  }

  res.status(200).json({
    success: true,
    data: {
      addresses: user.addresses || [],
    },
  });
});

/**
 * @desc    Crear nueva dirección
 * @route   POST /api/users/me/addresses
 * @access  Private
 */
export const createAddress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError(401, 'Usuario no autenticado'));
  }

  const addressData = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError(404, 'Usuario no encontrado'));
  }

  // Límite de 10 direcciones por usuario
  if (user.addresses && user.addresses.length >= 10) {
    return next(new AppError(400, 'Límite de 10 direcciones alcanzado'));
  }

  // Usar el método addAddress del modelo
  const updatedUser = await user.addAddress({
    ...addressData,
    isDefault: user.addresses.length === 0, // Primera dirección = default
  });

  const newAddress = updatedUser.addresses[updatedUser.addresses.length - 1];

  res.status(201).json({
    success: true,
    message: 'Dirección creada exitosamente',
    data: {
      address: newAddress,
    },
  });
});

/**
 * @desc    Actualizar dirección existente
 * @route   PUT /api/users/me/addresses/:id
 * @access  Private
 */
export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError(401, 'Usuario no autenticado'));
  }

  const { id: addressId } = req.params;
  const addressData = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError(404, 'Usuario no encontrado'));
  }

  // Usar el método updateAddress del modelo
  const updatedUser = await user.updateAddress(addressId, addressData);

  const updatedAddress = updatedUser.addresses.find(
    (addr) => addr._id.toString() === addressId
  );

  if (!updatedAddress) {
    return next(new AppError(404, 'Dirección no encontrada'));
  }

  res.status(200).json({
    success: true,
    message: 'Dirección actualizada exitosamente',
    data: {
      address: updatedAddress,
    },
  });
});

/**
 * @desc    Eliminar dirección
 * @route   DELETE /api/users/me/addresses/:id
 * @access  Private
 */
export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError(401, 'Usuario no autenticado'));
  }

  const { id: addressId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError(404, 'Usuario no encontrado'));
  }

  // Usar el método deleteAddress del modelo
  const updatedUser = await user.deleteAddress(addressId);

  res.status(200).json({
    success: true,
    message: 'Dirección eliminada exitosamente',
    data: {
      addresses: updatedUser.addresses,
    },
  });
});

/**
 * @desc    Marcar dirección como predeterminada
 * @route   PATCH /api/users/me/addresses/:id/default
 * @access  Private
 */
export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError(401, 'Usuario no autenticado'));
  }

  const { id: addressId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError(404, 'Usuario no encontrado'));
  }

  // Usar el método setDefaultAddress del modelo
  const updatedUser = await user.setDefaultAddress(addressId);

  const defaultAddress = updatedUser.addresses.find(
    (addr) => addr._id.toString() === addressId
  );

  res.status(200).json({
    success: true,
    message: 'Dirección predeterminada actualizada',
    data: {
      address: defaultAddress,
      addresses: updatedUser.addresses,
    },
  });
});
