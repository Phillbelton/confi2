import { Router } from 'express';
import * as homeLayoutController from '../controllers/homeLayoutController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/auditMiddleware';
import { updateHomeLayoutSchema } from '../schemas/homeLayoutSchemas';

const router = Router();

// Public: la tienda arma la home con esto
router.get('/', homeLayoutController.getHomeLayout);

// Admin: reordenar / ocultar secciones
router.put(
  '/',
  authenticate,
  authorize('admin'),
  validate(updateHomeLayoutSchema),
  auditLog('homeLayout', 'update'),
  homeLayoutController.updateHomeLayout
);

export default router;
