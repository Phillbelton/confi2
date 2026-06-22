import { z } from 'zod';
import { CATALOG_PRESENTATION_VARIANTS } from '../models/SiteSettings';

/**
 * PUT /api/site-settings — admin. Por ahora un solo campo; al agregar más,
 * sumarlos acá como opcionales y mergearlos en el controller.
 */
export const updateSiteSettingsSchema = z.object({
  body: z.object({
    catalogPresentationVariant: z.enum(CATALOG_PRESENTATION_VARIANTS),
  }),
});
