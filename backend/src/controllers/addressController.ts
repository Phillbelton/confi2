/**
 * Address Controller
 *
 * Controlador delgado que delega lógica de negocio al UserService.
 * Maneja operaciones CRUD de direcciones de usuario.
 */

import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { userService } from '../services/userService';
import { successResponse, SuccessMessages } from '../utils/responseHelpers';

/**
 * @desc    Obtener todas las direcciones del usuario
 * @route   GET /api/users/me/addresses
 * @access  Private
 */
export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  // Delegar lógica al service
  const addresses = await userService.getUserAddresses(req.user.id);

  res.status(200).json(
    successResponse({
      addresses,
    })
  );
});

/**
 * @desc    Crear nueva dirección
 * @route   POST /api/users/me/addresses
 * @access  Private
 */
export const createAddress = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  // Delegar lógica al service
  const user = await userService.addAddress(req.user.id, req.body);

  // Obtener la dirección recién creada (última en el array)
  const newAddress = user.addresses[user.addresses.length - 1];

  res.status(201).json(
    successResponse(
      {
        address: newAddress,
      },
      'Dirección creada exitosamente'
    )
  );
});

/**
 * @desc    Actualizar dirección existente
 * @route   PUT /api/users/me/addresses/:id
 * @access  Private
 */
export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  const { id: addressId } = req.params;

  // Delegar lógica al service
  const user = await userService.updateAddress(req.user.id, addressId, req.body);

  // Encontrar la dirección actualizada
  const updatedAddress = user.addresses.find((addr) => addr._id.toString() === addressId);

  res.status(200).json(
    successResponse(
      {
        address: updatedAddress,
      },
      'Dirección actualizada exitosamente'
    )
  );
});

/**
 * @desc    Eliminar dirección
 * @route   DELETE /api/users/me/addresses/:id
 * @access  Private
 */
export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  const { id: addressId } = req.params;

  // Delegar lógica al service
  const user = await userService.deleteAddress(req.user.id, addressId);

  res.status(200).json(
    successResponse(
      {
        addresses: user.addresses,
      },
      'Dirección eliminada exitosamente'
    )
  );
});

/**
 * @desc    Marcar dirección como predeterminada
 * @route   PUT /api/users/me/addresses/:id/default
 * @access  Private
 */
export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  const { id: addressId } = req.params;

  // Delegar lógica al service
  const user = await userService.setDefaultAddress(req.user.id, addressId);

  // Encontrar la dirección que ahora es default
  const defaultAddress = user.addresses.find((addr) => addr._id.toString() === addressId);

  res.status(200).json(
    successResponse(
      {
        address: defaultAddress,
        addresses: user.addresses,
      },
      'Dirección predeterminada actualizada'
    )
  );
});
