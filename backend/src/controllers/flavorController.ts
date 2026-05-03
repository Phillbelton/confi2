import { Response } from 'express';
import mongoose from 'mongoose';
import { Flavor } from '../models/Flavor';
import Product from '../models/Product';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const listFlavors = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { active = 'true' } = req.query as Record<string, string | undefined>;
    const filter: any = {};
    if (active === 'true') filter.active = true;
    else if (active === 'false') filter.active = false;

    const flavors = await Flavor.find(filter).sort({ name: 1 }).lean();
    const withCounts = await Promise.all(
      flavors.map(async (f) => {
        const productCount = await Product.countDocuments({ flavor: f._id, active: true });
        return { ...f, productCount };
      })
    );
    res.status(200).json({ success: true, data: { flavors: withCounts } });
  }
);

export const getFlavorById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const f = await Flavor.findById(req.params.id).lean();
    if (!f) throw new AppError(404, 'Sabor no encontrado');
    res.status(200).json({ success: true, data: { flavor: f } });
  }
);

export const createFlavor = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { name, color, active } = req.body;
    const flavor = await Flavor.create({
      name,
      color,
      active: active !== false,
      createdBy: req.user?.id,
    });
    res.status(201).json({ success: true, message: 'Sabor creado', data: { flavor } });
  }
);

export const updateFlavor = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const f = await Flavor.findById(req.params.id);
    if (!f) throw new AppError(404, 'Sabor no encontrado');
    const { name, color, active } = req.body;
    if (name !== undefined) f.name = name;
    if (color !== undefined) f.color = color;
    if (active !== undefined) f.active = active;
    if (req.user?.id) f.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    await f.save();
    res.status(200).json({ success: true, message: 'Sabor actualizado', data: { flavor: f } });
  }
);

export const deleteFlavor = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const f = await Flavor.findById(req.params.id);
    if (!f) throw new AppError(404, 'Sabor no encontrado');
    const inUse = await Product.countDocuments({ flavor: f._id });
    if (inUse > 0) {
      throw new AppError(
        400,
        `No se puede eliminar: ${inUse} producto(s) usan este sabor. Desactivá en su lugar.`
      );
    }
    await f.deleteOne();
    res.status(200).json({ success: true, message: 'Sabor eliminado' });
  }
);
