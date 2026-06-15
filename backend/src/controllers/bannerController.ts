import { Response } from 'express';
import Banner from '../models/Banner';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { imageService } from '../services/imageService';
import logger from '../config/logger';

/**
 * Banner controller — heroes, banners promocionales, secciones de home.
 */

// @desc    Listar banners (con filtros para frontend y admin)
// @route   GET /api/banners
// @access  Public (con flags) / Admin (sin filtros)
export const getBanners = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { placement, active } = req.query as Record<string, string | undefined>;

    const filter: any = {};
    if (placement) filter.placement = placement;
    if (active === 'true') filter.active = true;
    else if (active === 'false') filter.active = false;

    // Si el caller no es admin, filtrar por schedule (startDate/endDate)
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'funcionario';
    if (!isAdmin) {
      const now = new Date();
      filter.active = true;
      filter.$and = [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
      ];
    }

    const banners = await Banner.find(filter)
      .sort({ placement: 1, rowOrder: 1, order: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { banners },
    });
  }
);

// @desc    Obtener banner por ID
// @route   GET /api/banners/:id
// @access  Public
export const getBannerById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const banner = await Banner.findById(req.params.id).lean();
    if (!banner) throw new AppError(404, 'Banner no encontrado');
    res.status(200).json({ success: true, data: { banner } });
  }
);

// @desc    Crear banner
// @route   POST /api/banners
// @access  Admin, Funcionario
export const createBanner = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const {
      placement,
      order,
      size,
      rowOrder,
      cols,
      mobileMode,
      image,
      imageMobile,
      title,
      subtitle,
      ctaText,
      link,
      active,
      startDate,
      endDate,
    } = req.body;

    if (!image) throw new AppError(400, 'image es requerido');
    if (!placement) throw new AppError(400, 'placement es requerido');

    const banner = await Banner.create({
      placement,
      order: order ?? 0,
      size: size || 'normal',
      rowOrder: rowOrder ?? 0,
      cols: cols ?? 1,
      mobileMode: mobileMode || 'stack',
      image,
      imageMobile,
      title,
      subtitle,
      ctaText,
      link: link || { type: 'none' },
      active: active ?? true,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      createdBy: (req.user as any)?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Banner creado',
      data: { banner },
    });
  }
);

// @desc    Actualizar banner
// @route   PUT /api/banners/:id
// @access  Admin, Funcionario
export const updateBanner = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const banner = await Banner.findById(req.params.id);
    if (!banner) throw new AppError(404, 'Banner no encontrado');

    const {
      placement,
      order,
      size,
      rowOrder,
      cols,
      mobileMode,
      image,
      imageMobile,
      title,
      subtitle,
      ctaText,
      link,
      active,
      startDate,
      endDate,
    } = req.body;

    // La imagen principal se gestiona vía /banners/:id/image — no se pisa acá
    if (image !== undefined && image !== banner.image) {
      // Permitir borrar (image: '') o setear desde URL externa
      if (banner.image && banner.image !== image) {
        try {
          await imageService.deleteImage(banner.image);
        } catch (e: any) {
          logger.warn(`[banner] could not delete old image: ${e.message}`);
        }
      }
      banner.image = image || banner.image;
    }
    if (imageMobile !== undefined) banner.imageMobile = imageMobile;
    if (placement !== undefined) banner.placement = placement;
    if (order !== undefined) banner.order = order;
    if (size !== undefined) banner.size = size;
    if (rowOrder !== undefined) banner.rowOrder = rowOrder;
    if (cols !== undefined) banner.cols = cols;
    if (mobileMode !== undefined) banner.mobileMode = mobileMode;
    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (ctaText !== undefined) banner.ctaText = ctaText;
    if (link !== undefined) banner.link = link;
    if (active !== undefined) banner.active = active;
    if (startDate !== undefined) banner.startDate = startDate || undefined;
    if (endDate !== undefined) banner.endDate = endDate || undefined;
    if (req.user?.id) banner.updatedBy = req.user.id as any;

    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner actualizado',
      data: { banner },
    });
  }
);

// @desc    Eliminar banner
// @route   DELETE /api/banners/:id
// @access  Admin
export const deleteBanner = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const banner = await Banner.findById(req.params.id);
    if (!banner) throw new AppError(404, 'Banner no encontrado');

    if (banner.image) {
      try {
        await imageService.deleteImage(banner.image);
      } catch {}
    }
    if (banner.imageMobile) {
      try {
        await imageService.deleteImage(banner.imageMobile);
      } catch {}
    }

    await banner.deleteOne();

    res.status(200).json({ success: true, message: 'Banner eliminado' });
  }
);

// @desc    Guardar layout (bulk): orden + franjas (rowOrder/cols/mobileMode)
// @route   PATCH /api/banners/reorder
// @access  Admin, Funcionario
//
// Acepta el shape legacy `{ id, order }` y el extendido
// `{ id, order, rowOrder, cols, mobileMode }`. Sólo escribe los campos presentes
// en cada item, por lo que un reorder simple sigue funcionando sin tocar franjas.
export const reorderBanners = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items } = req.body as {
      items: {
        id: string;
        order?: number;
        rowOrder?: number;
        cols?: 1 | 2 | 3 | 4;
        mobileMode?: 'stack' | 'scroll';
      }[];
    };
    if (!Array.isArray(items)) throw new AppError(400, 'items requerido');

    await Promise.all(
      items.map((it) => {
        const set: Record<string, unknown> = {};
        if (it.order !== undefined) set.order = it.order;
        if (it.rowOrder !== undefined) set.rowOrder = it.rowOrder;
        if (it.cols !== undefined) set.cols = it.cols;
        if (it.mobileMode !== undefined) set.mobileMode = it.mobileMode;
        if (Object.keys(set).length === 0) return Promise.resolve();
        return Banner.updateOne({ _id: it.id }, { $set: set });
      })
    );

    res.status(200).json({ success: true, message: 'Layout actualizado' });
  }
);
