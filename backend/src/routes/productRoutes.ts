import { Router } from 'express';
import * as productController from '../controllers/productController';
import * as productFacetsController from '../controllers/productFacetsController';
import * as productImportController from '../controllers/productImportController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadMultiple, handleMulterError } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { parseProductFormData } from '../middleware/parseFormData';
import { auditLog, captureBeforeState } from '../middleware/auditMiddleware';
import Product from '../models/Product';
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  getProductsQuerySchema,
  getProductBySlugSchema,
  deleteProductSchema,
  getFeaturedProductsSchema,
} from '../schemas/productSchemas';

const router = Router();

// Public
router.get('/', validate(getProductsQuerySchema), productController.listProducts);
router.get('/featured', validate(getFeaturedProductsSchema), productController.listFeaturedProducts);
router.get('/facets', productFacetsController.getProductFacets);
router.get('/slug/:slug', validate(getProductBySlugSchema), productController.getProductBySlug);
router.get('/:id', validate(getProductByIdSchema), productController.getProductById);

// Bulk import desde Excel — solo admin
router.post(
  '/import-excel',
  authenticate,
  authorize('admin'),
  productImportController.uploadExcelMiddleware,
  productImportController.importProductsFromExcel
);

// Admin CRUD
router.post(
  '/',
  authenticate,
  uploadMultiple,
  handleMulterError,
  parseProductFormData,
  authorize('admin', 'funcionario'),
  validate(createProductSchema),
  auditLog('product', 'create'),
  productController.createProduct
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'funcionario'),
  captureBeforeState(Product),
  validate(updateProductSchema),
  auditLog('product', 'update'),
  productController.updateProduct
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  captureBeforeState(Product),
  validate(deleteProductSchema),
  auditLog('product', 'delete'),
  productController.deleteProduct
);

export default router;
