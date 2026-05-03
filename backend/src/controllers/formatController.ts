import { Response } from 'express';
import mongoose from 'mongoose';
import { Format } from '../models/Format';
import Product from '../models/Product';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const listFormats = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { active = 'true' } = req.query as Record<string, string | undefined>;
    const filter: any = {};
    if (active === 'true') filter.active = true;
    else if (active === 'false') filter.active = false;

    const formats = await Format.find(filter).sort({ value: 1, unit: 1 }).lean();

    // Contar productos por formato (info útil en mantenedor)
    const withCounts = await Promise.all(
      formats.map(async (f) => {
        const productCount = await Product.countDocuments({ format: f._id, active: true });
        return { ...f, productCount };
      })
    );

    res.status(200).json({ success: true, data: { formats: withCounts } });
  }
);

export const getFormatById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const f = await Format.findById(req.params.id).lean();
    if (!f) throw new AppError(404, 'Formato no encontrado');
    res.status(200).json({ success: true, data: { format: f } });
  }
);

export const createFormat = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { value, unit, label, active } = req.body;
    const format = await Format.create({
      value,
      unit,
      label,
      active: active !== false,
      createdBy: req.user?.id,
    });
    res.status(201).json({
      success: true,
      message: 'Formato creado',
      data: { format },
    });
  }
);

export const updateFormat = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const f = await Format.findById(req.params.id);
    if (!f) throw new AppError(404, 'Formato no encontrado');
    const { value, unit, label, active } = req.body;
    if (value !== undefined) f.value = value;
    if (unit !== undefined) f.unit = unit;
    if (label !== undefined) f.label = label;
    if (active !== undefined) f.active = active;
    if (req.user?.id) f.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    await f.save();
    res.status(200).json({ success: true, message: 'Formato actualizado', data: { format: f } });
  }
);

export const deleteFormat = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const f = await Format.findById(req.params.id);
    if (!f) throw new AppError(404, 'Formato no encontrado');
    const inUse = await Product.countDocuments({ format: f._id });
    if (inUse > 0) {
      throw new AppError(
        400,
        `No se puede eliminar: ${inUse} producto(s) usan este formato. Desactivá en su lugar.`
      );
    }
    await f.deleteOne();
    res.status(200).json({ success: true, message: 'Formato eliminado' });
  }
);
