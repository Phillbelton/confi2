import { z } from 'zod';
import { HOME_SECTION_KEYS } from '../models/HomeLayout';

/**
 * PUT /api/home-layout — el body debe traer EXACTAMENTE el set canónico de
 * secciones (cada una una sola vez, ninguna de menos): la Fase 1 solo
 * permite reordenar y ocultar, no agregar ni quitar secciones.
 */
export const updateHomeLayoutSchema = z.object({
  body: z.object({
    sections: z
      .array(
        z.object({
          key: z.enum(HOME_SECTION_KEYS),
          active: z.boolean(),
        })
      )
      .length(HOME_SECTION_KEYS.length, {
        message: `Deben venir las ${HOME_SECTION_KEYS.length} secciones`,
      })
      .refine(
        (sections) => new Set(sections.map((s) => s.key)).size === sections.length,
        { message: 'Hay secciones repetidas' }
      ),
  }),
});
