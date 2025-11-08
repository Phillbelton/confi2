import { Router } from 'express';
import * as stockMovementController from '../controllers/stockMovementController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  adjustStockSchema,
  restockSchema,
  getVariantMovementsSchema,
  getOrderMovementsSchema,
  getMovementsQuerySchema,
} from '../schemas/stockMovementSchemas';

const router = Router();

// All routes protected (admin, funcionario only)
router.use(authenticate);
router.use(authorize('admin', 'funcionario'));

// Get movements
router.get('/', validate(getMovementsQuerySchema), stockMovementController.getMovements);
router.get('/variant/:variantId', validate(getVariantMovementsSchema), stockMovementController.getVariantMovements);
router.get('/order/:orderId', validate(getOrderMovementsSchema), stockMovementController.getOrderMovements);

// Modify stock
router.post('/adjust', validate(adjustStockSchema), stockMovementController.adjustStockManually);
router.post('/restock', validate(restockSchema), stockMovementController.restockProduct);

export default router;
