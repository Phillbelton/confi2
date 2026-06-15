import { z } from 'zod';
import {
  HOME_SECTION_TYPES,
  SINGLETON_SECTION_TYPES,
  PRODUCT_SOURCES,
  BANNER_ZONE_PLACEMENTS,
} from '../models/HomeLayout';

/**
 * PUT /api/home-layout — Fase 2.
 *
 * Estructura exigida:
 *  - hero / collections / static_cta: exactamente UNA de cada una.
 *  - banner_zone: exactamente DOS, una por placement (secondary y promo) —
 *    son zonas fijas atadas a los datos de banners.
 *  - product_carousel / product_grid: 0..N instancias, cada una con config
 *    completa (título, fuente; colección requerida si source='collection').
 *  - ids únicos, máximo 20 secciones en total.
 */

const storeSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    address: z.string().trim().min(1).max(160),
    mapQuery: z.string().trim().min(1).max(220),
    hours: z.string().trim().max(160).optional(),
  })
  .strict();

const configSchema = z
  .object({
    placement: z.enum(BANNER_ZONE_PLACEMENTS).optional(),
    title: z.string().trim().min(1).max(40).optional(),
    emoji: z.string().trim().max(8).optional(),
    source: z.enum(PRODUCT_SOURCES).optional(),
    collectionSlug: z.string().trim().min(1).max(120).optional(),
    limit: z.number().int().min(2).max(20).optional(),
    stores: z.array(storeSchema).min(1).max(4).optional(),
  })
  .strict();

const sectionSchema = z
  .object({
    id: z.string().trim().min(1).max(60),
    type: z.enum(HOME_SECTION_TYPES),
    active: z.boolean(),
    config: configSchema.optional(),
  })
  .strict()
  .superRefine((section, ctx) => {
    if (section.type === 'banner_zone' && !section.config?.placement) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'banner_zone requiere config.placement',
      });
    }
    if (section.type === 'location_map' && !section.config?.stores?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'location_map requiere config.stores con al menos un local',
      });
    }
    if (section.type === 'product_carousel' || section.type === 'product_grid') {
      if (!section.config?.title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${section.type} requiere config.title`,
        });
      }
      if (!section.config?.source) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${section.type} requiere config.source`,
        });
      } else if (
        section.config.source === 'collection' &&
        !section.config.collectionSlug
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'source=collection requiere config.collectionSlug',
        });
      }
    }
  });

export const updateHomeLayoutSchema = z.object({
  body: z.object({
    sections: z
      .array(sectionSchema)
      .min(1)
      .max(20, { message: 'Máximo 20 secciones' })
      .superRefine((sections, ctx) => {
        // ids únicos
        if (new Set(sections.map((s) => s.id)).size !== sections.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Hay ids de sección repetidos',
          });
        }
        // singletons: exactamente una de cada
        for (const type of SINGLETON_SECTION_TYPES) {
          const count = sections.filter((s) => s.type === type).length;
          if (count !== 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Debe haber exactamente una sección '${type}' (hay ${count})`,
            });
          }
        }
        // mapa de tiendas: a lo sumo una
        const maps = sections.filter((s) => s.type === 'location_map').length;
        if (maps > 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `A lo sumo una sección 'location_map' (hay ${maps})`,
          });
        }
        // banner zones: una por placement
        for (const placement of BANNER_ZONE_PLACEMENTS) {
          const count = sections.filter(
            (s) => s.type === 'banner_zone' && s.config?.placement === placement
          ).length;
          if (count !== 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Debe haber exactamente una banner_zone '${placement}' (hay ${count})`,
            });
          }
        }
      }),
  }),
});
