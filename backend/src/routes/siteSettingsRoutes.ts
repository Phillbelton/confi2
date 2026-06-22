import { Router } from 'express';
import * as siteSettingsController from '../controllers/siteSettingsController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/auditMiddleware';
import { updateSiteSettingsSchema } from '../schemas/siteSettingsSchemas';

const router = Router();

// Público: la tienda lee la variante de presentación de la card
router.get('/', siteSettingsController.getSiteSettings);

// Admin: cambiar ajustes del sitio
router.put(
  '/',
  authenticate,
  authorize('admin'),
  validate(updateSiteSettingsSchema),
  auditLog('siteSettings', 'update'),
  siteSettingsController.updateSiteSettings
);

export default router;
