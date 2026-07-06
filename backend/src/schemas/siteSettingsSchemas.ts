import { z } from 'zod';
import {
  CATALOG_PRESENTATION_VARIANTS,
  CATALOG_NAV_STYLES,
} from '../models/SiteSettings';

/**
 * PUT /api/site-settings — admin. Update PARCIAL: cada campo es opcional pero
 * el body debe traer al menos uno (evita PUTs vacíos accidentales). El
 * controller solo persiste los campos presentes.
 */
export const updateSiteSettingsSchema = z.object({
  body: z
    .object({
      catalogPresentationVariant: z.enum(CATALOG_PRESENTATION_VARIANTS).optional(),
      catalogNavStyle: z.enum(CATALOG_NAV_STYLES).optional(),
    })
    .refine(
      (b) => b.catalogPresentationVariant !== undefined || b.catalogNavStyle !== undefined,
      { message: 'Debe incluir al menos un ajuste para actualizar' }
    ),
});
