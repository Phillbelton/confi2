import { Router } from 'express';
import * as formatController from '../controllers/formatController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFormatSchema, updateFormatSchema } from '../schemas/productSchemas';

const router = Router();

router.get('/', formatController.listFormats);
router.get('/:id', formatController.getFormatById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'funcionario'),
  validate(createFormatSchema),
  formatController.createFormat
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'funcionario'),
  validate(updateFormatSchema),
  formatController.updateFormat
);
router.delete('/:id', authenticate, authorize('admin'), formatController.deleteFormat);

export default router;
