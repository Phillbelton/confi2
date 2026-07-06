import { Response } from 'express';
import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  CatalogPresentationVariant,
  CatalogNavStyle,
} from '../models/SiteSettings';
import { AuthRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * GET /api/site-settings — público. Si nunca se personalizó, devuelve los
 * defaults sin crear el doc (la tienda siempre tiene un valor que leer).
 */
export const getSiteSettings = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const doc = await SiteSettings.findOne({ key: 'site' }).lean();

    res.status(200).json({
      success: true,
      data: {
        catalogPresentationVariant:
          doc?.catalogPresentationVariant ??
          DEFAULT_SITE_SETTINGS.catalogPresentationVariant,
        catalogNavStyle:
          doc?.catalogNavStyle ?? DEFAULT_SITE_SETTINGS.catalogNavStyle,
      },
    });
  }
);

/**
 * PUT /api/site-settings — admin. Upsert PARCIAL del singleton: solo pisa los
 * campos presentes en el body (el schema Zod ya validó enums y ≥1 campo).
 */
export const updateSiteSettings = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { catalogPresentationVariant, catalogNavStyle } = req.body as {
      catalogPresentationVariant?: CatalogPresentationVariant;
      catalogNavStyle?: CatalogNavStyle;
    };

    const $set: Record<string, unknown> = { updatedBy: req.user?.id };
    if (catalogPresentationVariant !== undefined) {
      $set.catalogPresentationVariant = catalogPresentationVariant;
    }
    if (catalogNavStyle !== undefined) {
      $set.catalogNavStyle = catalogNavStyle;
    }

    const doc = await SiteSettings.findOneAndUpdate(
      { key: 'site' },
      { $set },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Ajustes del sitio guardados',
      data: {
        _id: doc._id,
        catalogPresentationVariant: doc.catalogPresentationVariant,
        catalogNavStyle: doc.catalogNavStyle,
      },
    });
  }
);
