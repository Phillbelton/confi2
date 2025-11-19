import { Router } from 'express';
import * as brandController from '../controllers/brandController';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingle, handleMulterError } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { auditLog, captureBeforeState } from '../middleware/auditMiddleware';
import Brand from '../models/Brand';
import * as brandSchemas from '../schemas/brandSchemas';

const router = Router();

// Public routes
router.get('/', validate(brandSchemas.getBrandsQuerySchema), brandController.getBrands);
router.get('/:id', validate(brandSchemas.getBrandByIdSchema), brandController.getBrandById);
router.get('/slug/:slug', validate(brandSchemas.getBrandBySlugSchema), brandController.getBrandBySlug);

// Protected routes (admin, funcionario)
router.post('/', authenticate, authorize('admin', 'funcionario'), validate(brandSchemas.createBrandSchema), auditLog('brand', 'create'), brandController.createBrand);
router.put('/:id', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Brand), validate(brandSchemas.updateBrandSchema), auditLog('brand', 'update'), brandController.updateBrand);

// Protected routes (admin only)
router.delete('/:id', authenticate, authorize('admin'), captureBeforeState(Brand), validate(brandSchemas.deleteBrandSchema), auditLog('brand', 'delete'), brandController.deleteBrand);

// Image upload routes for Brand
router.post(
  '/:id/logo',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadSingle,
  handleMulterError,
  uploadController.uploadBrandLogo
);

export default router;
