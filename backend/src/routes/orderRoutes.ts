import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog, captureBeforeState } from '../middleware/auditMiddleware';
import { Order } from '../models/Order';
import {
  createOrderSchema,
  confirmOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  getOrdersQuerySchema,
  getOrderByIdSchema,
  getOrderByNumberSchema,
  getMyOrdersQuerySchema,
  markWhatsAppSentSchema,
  getOrderStatsQuerySchema,
  editOrderItemsSchema,
} from '../schemas/orderSchema';

const router = Router();

// Public routes (crear orden - visita puede crear orden, pero si está autenticado se vincula al usuario)
router.post('/validate-cart', orderController.validateCart);
router.post('/', optionalAuth, validate(createOrderSchema), auditLog('order', 'create'), orderController.createOrder);
router.get('/number/:orderNumber', validate(getOrderByNumberSchema), orderController.getOrderByNumber);

// Protected routes (cliente autenticado puede ver sus órdenes)
router.get('/my-orders', authenticate, authorize('cliente'), validate(getMyOrdersQuerySchema), orderController.getMyOrders);
router.get('/:id', validate(getOrderByIdSchema), orderController.getOrderById);

// Protected routes (admin, funcionario)
router.get('/', authenticate, authorize('admin', 'funcionario'), validate(getOrdersQuerySchema), orderController.getOrders);
router.get('/stats', authenticate, authorize('admin', 'funcionario'), validate(getOrderStatsQuerySchema), orderController.getOrderStats);
router.put('/:id/confirm', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Order), validate(confirmOrderSchema), auditLog('order', 'update'), orderController.confirmOrder);
router.put('/:id/status', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Order), validate(updateOrderStatusSchema), auditLog('order', 'update'), orderController.updateOrderStatus);
router.put('/:id/items', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Order), validate(editOrderItemsSchema), auditLog('order', 'update'), orderController.editOrderItems);
router.put('/:id/shipping', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Order), auditLog('order', 'update'), orderController.updateShippingCost);
router.put('/:id/whatsapp-sent', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Order), validate(markWhatsAppSentSchema), auditLog('order', 'update'), orderController.markWhatsAppSent);

// Cancel order (owner, admin, funcionario)
router.put('/:id/cancel', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Order), validate(cancelOrderSchema), auditLog('order', 'cancel'), orderController.cancelOrder);

export default router;
