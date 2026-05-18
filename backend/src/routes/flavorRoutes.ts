import { Router } from 'express';
import * as flavorController from '../controllers/flavorController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFlavorSchema, updateFlavorSchema } from '../schemas/productSchemas';

const router = Router();

router.get('/', flavorController.listFlavors);
router.get('/:id', flavorController.getFlavorById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createFlavorSchema),
  flavorController.createFlavor
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateFlavorSchema),
  flavorController.updateFlavor
);
router.delete('/:id', authenticate, authorize('admin'), flavorController.deleteFlavor);

export default router;
