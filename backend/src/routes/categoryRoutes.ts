import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingle, handleMulterError } from '../middleware/upload';
import { validate } from '../middleware/validate';
import * as categorySchemas from '../schemas/categorySchemas';

const router = Router();

// Public routes
router.get('/', validate(categorySchemas.getCategoriesQuerySchema), categoryController.getCategories);
router.get('/main', categoryController.getMainCategories);
router.get('/:id', validate(categorySchemas.getCategoryByIdSchema), categoryController.getCategoryById);
router.get('/slug/:slug', validate(categorySchemas.getCategoryBySlugSchema), categoryController.getCategoryBySlug);
router.get('/:id/subcategories', validate(categorySchemas.getSubcategoriesSchema), categoryController.getSubcategories);

// Protected routes (admin, funcionario)
router.post('/', authenticate, authorize('admin', 'funcionario'), validate(categorySchemas.createCategorySchema), categoryController.createCategory);
router.put('/:id', authenticate, authorize('admin', 'funcionario'), validate(categorySchemas.updateCategorySchema), categoryController.updateCategory);

// Protected routes (admin only)
router.delete('/:id', authenticate, authorize('admin'), validate(categorySchemas.deleteCategorySchema), categoryController.deleteCategory);

// Image upload routes for Category
router.post(
  '/:id/image',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadSingle,
  handleMulterError,
  uploadController.uploadCategoryImage
);

export default router;
