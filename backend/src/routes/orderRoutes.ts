import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
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

// Public routes (crear orden - visita puede crear orden)
router.post('/validate-cart', orderController.validateCart);
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/number/:orderNumber', validate(getOrderByNumberSchema), orderController.getOrderByNumber);

// Protected routes (cliente autenticado puede ver sus órdenes)
router.get('/my-orders', authenticate, authorize('cliente'), validate(getMyOrdersQuerySchema), orderController.getMyOrders);
router.get('/:id', validate(getOrderByIdSchema), orderController.getOrderById);

// Protected routes (admin, funcionario)
router.get('/', authenticate, authorize('admin', 'funcionario'), validate(getOrdersQuerySchema), orderController.getOrders);
router.get('/stats', authenticate, authorize('admin', 'funcionario'), validate(getOrderStatsQuerySchema), orderController.getOrderStats);
router.put('/:id/confirm', authenticate, authorize('admin', 'funcionario'), validate(confirmOrderSchema), orderController.confirmOrder);
router.put('/:id/status', authenticate, authorize('admin', 'funcionario'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.put('/:id/items', authenticate, authorize('admin', 'funcionario'), validate(editOrderItemsSchema), orderController.editOrderItems);
router.put('/:id/whatsapp-sent', authenticate, authorize('admin', 'funcionario'), validate(markWhatsAppSentSchema), orderController.markWhatsAppSent);

// Cancel order (owner, admin, funcionario)
router.put('/:id/cancel', validate(cancelOrderSchema), orderController.cancelOrder);

export default router;
