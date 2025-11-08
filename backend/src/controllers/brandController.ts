import { Response } from 'express';
import { Brand, IBrand } from '../models/Brand';
import ProductParent from '../models/ProductParent';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Controller para Brand
 */

// @desc    Obtener todas las marcas activas
// @route   GET /api/brands
// @access  Public
export const getBrands = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const includeInactive = req.query.includeInactive === 'true';

    const query = includeInactive ? {} : { active: true };

    const brands = await Brand.find(query).sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: { brands },
    });
  }
);

// @desc    Obtener marca por ID
// @route   GET /api/brands/:id
// @access  Public
export const getBrandById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      throw new AppError(404, 'Marca no encontrada');
    }

    // Contar productos
    const productCount = await ProductParent.countDocuments({
      brand: brand._id,
      active: true,
    });

    res.status(200).json({
      success: true,
      data: {
        brand: {
          ...brand.toJSON(),
          productCount,
        },
      },
    });
  }
);

// @desc    Obtener marca por slug
// @route   GET /api/brands/slug/:slug
// @access  Public
export const getBrandBySlug = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const brand = await Brand.findOne({ slug: req.params.slug, active: true });

    if (!brand) {
      throw new AppError(404, 'Marca no encontrada');
    }

    const productCount = await ProductParent.countDocuments({
      brand: brand._id,
      active: true,
    });

    res.status(200).json({
      success: true,
      data: {
        brand: {
          ...brand.toJSON(),
          productCount,
        },
      },
    });
  }
);

// @desc    Crear marca
// @route   POST /api/brands
// @access  Private (admin, funcionario)
export const createBrand = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { name, logo, active } = req.body;

    const brand = await Brand.create({
      name,
      logo,
      active: active !== undefined ? active : true,
    });

    res.status(201).json({
      success: true,
      message: 'Marca creada exitosamente',
      data: { brand },
    });
  }
);

// @desc    Actualizar marca
// @route   PUT /api/brands/:id
// @access  Private (admin, funcionario)
export const updateBrand = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      throw new AppError(404, 'Marca no encontrada');
    }

    const { name, logo, active } = req.body;

    if (name !== undefined) brand.name = name;
    if (logo !== undefined) brand.logo = logo;
    if (active !== undefined) brand.active = active;

    await brand.save();

    res.status(200).json({
      success: true,
      message: 'Marca actualizada exitosamente',
      data: { brand },
    });
  }
);

// @desc    Eliminar marca (soft delete)
// @route   DELETE /api/brands/:id
// @access  Private (admin)
export const deleteBrand = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      throw new AppError(404, 'Marca no encontrada');
    }

    // Verificar que no tenga productos
    const hasProducts = await brand.hasProducts();
    if (hasProducts) {
      throw new AppError(
        400,
        'No se puede eliminar una marca con productos activos. Reasigne o elimine primero los productos.'
      );
    }

    brand.active = false;
    await brand.save();

    res.status(200).json({
      success: true,
      message: 'Marca eliminada exitosamente',
    });
  }
);
