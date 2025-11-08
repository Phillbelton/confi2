import { Router } from 'express';
import { z } from 'zod';
import * as addressController from '../controllers/addressController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
} from '../schemas/addressSchema';

const router = Router();

/**
 * Address Routes
 * Base: /api/users/me/addresses
 * All routes require authentication
 */

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/users/me/addresses - Obtener todas las direcciones del usuario
router.get('/', addressController.getAddresses);

// POST /api/users/me/addresses - Crear nueva dirección
router.post('/', validate(z.object({ body: createAddressSchema })), addressController.createAddress);

// PUT /api/users/me/addresses/:id - Actualizar dirección
router.put('/:id', validate(z.object({ params: addressIdSchema, body: updateAddressSchema })), addressController.updateAddress);

// DELETE /api/users/me/addresses/:id - Eliminar dirección
router.delete('/:id', validate(z.object({ params: addressIdSchema })), addressController.deleteAddress);

// PATCH /api/users/me/addresses/:id/default - Marcar como predeterminada
router.patch('/:id/default', validate(z.object({ params: addressIdSchema })), addressController.setDefaultAddress);

export default router;
