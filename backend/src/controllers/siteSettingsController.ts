import { Response } from 'express';
import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  CatalogPresentationVariant,
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
      },
    });
  }
);

/**
 * PUT /api/site-settings — admin. Upsert del singleton. El schema Zod ya
 * validó el enum de la variante.
 */
export const updateSiteSettings = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { catalogPresentationVariant } = req.body as {
      catalogPresentationVariant: CatalogPresentationVariant;
    };

    const doc = await SiteSettings.findOneAndUpdate(
      { key: 'site' },
      { catalogPresentationVariant, updatedBy: req.user?.id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Ajustes del sitio guardados',
      data: { _id: doc._id, catalogPresentationVariant: doc.catalogPresentationVariant },
    });
  }
);
