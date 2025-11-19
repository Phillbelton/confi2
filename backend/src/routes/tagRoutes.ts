import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog, captureBeforeState } from '../middleware/auditMiddleware';
import { Tag } from '../models/Tag';
import * as tagSchemas from '../schemas/tagSchemas';

const router = Router();

// Public routes
router.get('/', validate(tagSchemas.getTagsQuerySchema), tagController.getTags);
router.get('/active', tagController.getActiveTags);
router.get('/:id', validate(tagSchemas.getTagByIdSchema), tagController.getTagById);
router.get('/slug/:slug', validate(tagSchemas.getTagBySlugSchema), tagController.getTagBySlug);

// Protected routes (admin, funcionario)
router.post('/', authenticate, authorize('admin', 'funcionario'), validate(tagSchemas.createTagSchema), auditLog('tag', 'create'), tagController.createTag);
router.post('/get-or-create', authenticate, authorize('admin', 'funcionario'), validate(tagSchemas.getOrCreateTagSchema), auditLog('tag', 'create'), tagController.getOrCreateTag);
router.put('/:id', authenticate, authorize('admin', 'funcionario'), captureBeforeState(Tag), validate(tagSchemas.updateTagSchema), auditLog('tag', 'update'), tagController.updateTag);

// Protected routes (admin only)
router.delete('/:id', authenticate, authorize('admin'), captureBeforeState(Tag), validate(tagSchemas.deleteTagSchema), auditLog('tag', 'delete'), tagController.deleteTag);

export default router;
