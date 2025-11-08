import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as tagSchemas from '../schemas/tagSchemas';

const router = Router();

// Public routes
router.get('/', validate(tagSchemas.getTagsQuerySchema), tagController.getTags);
router.get('/active', tagController.getActiveTags);
router.get('/:id', validate(tagSchemas.getTagByIdSchema), tagController.getTagById);
router.get('/slug/:slug', validate(tagSchemas.getTagBySlugSchema), tagController.getTagBySlug);

// Protected routes (admin, funcionario)
router.post('/', authenticate, authorize('admin', 'funcionario'), validate(tagSchemas.createTagSchema), tagController.createTag);
router.post('/get-or-create', authenticate, authorize('admin', 'funcionario'), validate(tagSchemas.getOrCreateTagSchema), tagController.getOrCreateTag);
router.put('/:id', authenticate, authorize('admin', 'funcionario'), validate(tagSchemas.updateTagSchema), tagController.updateTag);

// Protected routes (admin only)
router.delete('/:id', authenticate, authorize('admin'), validate(tagSchemas.deleteTagSchema), tagController.deleteTag);

export default router;
