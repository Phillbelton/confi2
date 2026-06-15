import { Response } from 'express';
import {
  HomeLayout,
  DEFAULT_HOME_SECTIONS,
  HomeSection,
  normalizeSections,
} from '../models/HomeLayout';
import { AuthRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * GET /api/home-layout — público. Si nunca se personalizó, devuelve el
 * layout por defecto (mismo orden histórico de la home) sin crear el doc.
 * Docs guardados con el shape Fase 1 ({key, active}) se migran al leer.
 */
export const getHomeLayout = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const doc = await HomeLayout.findOne({ key: 'home' }).lean();

    res.status(200).json({
      success: true,
      data: {
        sections: doc
          ? normalizeSections(doc.sections as unknown[])
          : DEFAULT_HOME_SECTIONS,
        isDefault: !doc,
      },
    });
  }
);

/**
 * PUT /api/home-layout — admin. Reemplaza el layout completo (orden =
 * posición en el array). El schema Zod ya garantizó la estructura
 * (singletons, zonas de banners, config de carruseles).
 */
export const updateHomeLayout = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { sections } = req.body as { sections: HomeSection[] };

    const doc = await HomeLayout.findOneAndUpdate(
      { key: 'home' },
      { sections, updatedBy: req.user?.id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Layout de la home guardado',
      data: { _id: doc._id, sections: doc.sections, isDefault: false },
    });
  }
);
