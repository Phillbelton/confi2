import { Router } from 'express';
import * as productParentController from '../controllers/productParentController';
import * as productVariantController from '../controllers/productVariantController';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadMultiple, uploadSingle, handleMulterError } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { parseProductFormData } from '../middleware/parseFormData';
import {
  createProductParentSchema,
  updateProductParentSchema,
  createProductVariantSchema,
  updateProductVariantSchema,
  updateStockSchema,
  getProductByIdSchema,
  getProductsQuerySchema,
  getProductBySlugSchema,
  deleteProductSchema,
  getProductVariantsSchema,
  getFeaturedProductsSchema,
  getVariantBySkuSchema,
  getDiscountPreviewSchema,
  getStockVariantsSchema,
} from '../schemas/productSchemas';

const router = Router();

/**
 * ProductParent Routes
 */

// Public routes
router.get('/parents', validate(getProductsQuerySchema), productParentController.getProductParents);
router.get('/parents/featured', validate(getFeaturedProductsSchema), productParentController.getFeaturedProducts);
router.get('/parents/:id', validate(getProductByIdSchema), productParentController.getProductParentById);
router.get('/parents/slug/:slug', validate(getProductBySlugSchema), productParentController.getProductParentBySlug);
router.get('/parents/:id/variants', validate(getProductVariantsSchema), productParentController.getProductParentVariants);

// Protected routes (admin, funcionario)
router.post(
  '/parents',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadMultiple, // Soporte opcional para archivos
  handleMulterError,
  parseProductFormData, // Parsear FormData a tipos correctos
  validate(createProductParentSchema),
  productParentController.createProductParent
);
router.put('/parents/:id', authenticate, authorize('admin', 'funcionario'), validate(updateProductParentSchema), productParentController.updateProductParent);
router.delete('/parents/:id', authenticate, authorize('admin', 'funcionario'), validate(deleteProductSchema), productParentController.deleteProductParent);

// Image upload routes for ProductParent
router.post(
  '/parents/:id/images',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadMultiple,
  handleMulterError,
  uploadController.uploadProductParentImages
);
router.delete(
  '/parents/:id/images/:filename',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadController.deleteProductParentImage
);

/**
 * ProductVariant Routes
 */

// Public routes
router.get('/variants', productVariantController.getProductVariants); // IMPORTANTE: Esta ruta debe ir ANTES de /variants/:id
router.get('/variants/:id', validate(getProductByIdSchema), productVariantController.getProductVariantById);
router.get('/variants/sku/:sku', validate(getVariantBySkuSchema), productVariantController.getProductVariantBySku);
router.get('/variants/:id/discount-preview', validate(getDiscountPreviewSchema), productVariantController.getVariantDiscountPreview);

// Protected routes (admin, funcionario)
router.post('/variants', authenticate, authorize('admin', 'funcionario'), validate(createProductVariantSchema), productVariantController.createProductVariant);
router.post('/parents/:id/variants/batch', authenticate, authorize('admin', 'funcionario'), productVariantController.createVariantsBatch);
router.post('/parents/:id/variants', authenticate, authorize('admin', 'funcionario'), productVariantController.addVariantToParent);
router.put('/variants/:id', authenticate, authorize('admin', 'funcionario'), validate(updateProductVariantSchema), productVariantController.updateProductVariant);
router.patch('/variants/:id/stock', authenticate, authorize('admin', 'funcionario'), validate(updateStockSchema), productVariantController.updateVariantStock);
router.delete('/variants/:id', authenticate, authorize('admin', 'funcionario'), validate(deleteProductSchema), productVariantController.deleteProductVariant);

// Stock monitoring routes
router.get('/variants/stock/low', authenticate, authorize('admin', 'funcionario'), validate(getStockVariantsSchema), productVariantController.getLowStockVariants);
router.get('/variants/stock/out', authenticate, authorize('admin', 'funcionario'), validate(getStockVariantsSchema), productVariantController.getOutOfStockVariants);

// Image upload routes for ProductVariant
router.post(
  '/variants/:id/images',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadMultiple,
  handleMulterError,
  uploadController.uploadProductVariantImages
);
router.delete(
  '/variants/:id/images/:filename',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadController.deleteProductVariantImage
);

export default router;
