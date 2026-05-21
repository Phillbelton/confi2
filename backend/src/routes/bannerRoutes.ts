import { Router } from 'express';
import * as bannerController from '../controllers/bannerController';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { uploadSingle, handleMulterError } from '../middleware/upload';

const router = Router();

// Public: list banners (filtra por placement, schedule activo)
router.get('/', optionalAuth, bannerController.getBanners);

// Public: get one
router.get('/:id', bannerController.getBannerById);

// Admin: create
router.post(
  '/',
  authenticate,
  authorize('admin'),
  bannerController.createBanner
);

// Admin: reorder (¡antes del :id por especificidad!)
router.patch(
  '/reorder',
  authenticate,
  authorize('admin'),
  bannerController.reorderBanners
);

// Admin: image upload (?variant=main|mobile)
router.post(
  '/:id/image',
  authenticate,
  authorize('admin'),
  uploadSingle,
  handleMulterError,
  uploadController.uploadBannerImage
);

// Admin: update
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  bannerController.updateBanner
);

// Admin only: delete
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  bannerController.deleteBanner
);

export default router;
