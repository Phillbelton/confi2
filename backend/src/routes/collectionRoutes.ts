import { Router } from 'express';
import * as collectionController from '../controllers/collectionController';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingle, handleMulterError } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { auditLog, captureBeforeState } from '../middleware/auditMiddleware';
import Collection from '../models/Collection';
import * as collectionSchemas from '../schemas/collectionSchemas';

const router = Router();

// Public routes
router.get(
  '/',
  validate(collectionSchemas.getCollectionsQuerySchema),
  collectionController.getCollections
);

router.get(
  '/slug/:slug',
  validate(collectionSchemas.getCollectionBySlugSchema),
  collectionController.getCollectionBySlug
);

router.get(
  '/slug/:slug/products',
  validate(collectionSchemas.getCollectionProductsSchema),
  collectionController.getCollectionProducts
);

router.get(
  '/:id',
  validate(collectionSchemas.getCollectionByIdSchema),
  collectionController.getCollectionById
);

// Protected routes (admin, funcionario)
router.post(
  '/',
  authenticate,
  authorize('admin', 'funcionario'),
  validate(collectionSchemas.createCollectionSchema),
  auditLog('collection', 'create'),
  collectionController.createCollection
);

router.patch(
  '/reorder',
  authenticate,
  authorize('admin', 'funcionario'),
  validate(collectionSchemas.reorderCollectionsSchema),
  collectionController.reorderCollections
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'funcionario'),
  captureBeforeState(Collection),
  validate(collectionSchemas.updateCollectionSchema),
  auditLog('collection', 'update'),
  collectionController.updateCollection
);

// Image upload — Cloudinary
router.post(
  '/:id/image',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadSingle,
  handleMulterError,
  uploadController.uploadCollectionImage
);

// Protected routes (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  captureBeforeState(Collection),
  validate(collectionSchemas.deleteCollectionSchema),
  auditLog('collection', 'delete'),
  collectionController.deleteCollection
);

export default router;
