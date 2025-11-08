import { Response } from 'express';
import ProductVariant, { IProductVariant } from '../models/ProductVariant';
import ProductParent from '../models/ProductParent';
import { AuthRequest, ApiResponse } from '../types';
import {
  getVisibleTierPreviews,
  calculatePriceByQuantity,
} from '../services/discountService';
import mongoose from 'mongoose';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Controller para ProductVariant
 */

/**
 * Crear ProductVariant
 * POST /api/products/variants
 * Role: admin, funcionario
 */
export const createProductVariant = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<IProductVariant>>) => {
    const {
      parentProduct,
      sku,
      attributes,
      description,
      name,
      price,
      stock,
      images,
      trackStock,
      allowBackorder,
      lowStockThreshold,
      fixedDiscount,
      order,
    } = req.body;

    // Validaciones básicas
    if (!parentProduct || !price || stock === undefined) {
      throw new AppError(
        400,
        'Faltan campos requeridos (parentProduct, price, stock)'
      );
    }

    // Verificar que el producto padre existe
    const parent = await ProductParent.findById(parentProduct);
    if (!parent) {
      throw new AppError(404, 'Producto padre no encontrado');
    }

    // Crear la variante
    const variant = await ProductVariant.create({
      parentProduct,
      sku,
      attributes: attributes || {},
      description,
      name: name || sku, // Si no hay name, usar SKU
      price,
      stock,
      images: images || [],
      trackStock: trackStock !== undefined ? trackStock : true,
      allowBackorder: allowBackorder !== undefined ? allowBackorder : true,
      lowStockThreshold: lowStockThreshold || 5,
      fixedDiscount,
      order: order || 0,
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Variante creada exitosamente',
      data: variant,
    });
  }
);

/**
 * Obtener una variante por ID
 * GET /api/products/variants/:id
 * Role: público
 */
export const getProductVariantById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const { id } = req.params;

    // Obtener la variante
    const variant = await ProductVariant.findById(id).populate(
      'parentProduct',
      'name slug description categories brand tags'
    );

    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

    // Obtener tier previews
    const tierPreviews = await getVisibleTierPreviews(variant._id);

    // Incrementar views del producto padre
    if (variant.parentProduct) {
      await ProductParent.findByIdAndUpdate(variant.parentProduct, {
        $inc: { views: 1 },
      });
    }

    // Incrementar views de la variante
    variant.views += 1;
    await variant.save();

    return res.status(200).json({
      success: true,
      data: {
        ...variant.toObject(),
        tierPreviews,
      },
    });
  }
);

/**
 * Obtener una variante por SKU
 * GET /api/products/variants/sku/:sku
 * Role: público
 */
export const getProductVariantBySku = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const { sku } = req.params;

    // Obtener la variante
    const variant = await ProductVariant.findOne({
      sku: sku.toUpperCase(),
      active: true,
    }).populate('parentProduct', 'name slug description categories brand tags');

    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

    // Obtener tier previews
    const tierPreviews = await getVisibleTierPreviews(variant._id);

    // Incrementar views
    variant.views += 1;
    await variant.save();

    return res.status(200).json({
      success: true,
      data: {
        ...variant.toObject(),
        tierPreviews,
      },
    });
  }
);

/**
 * Actualizar ProductVariant
 * PUT /api/products/variants/:id
 * Role: admin, funcionario
 */
export const updateProductVariant = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<IProductVariant>>) => {
    const { id } = req.params;

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'ID de variante inválido');
    }

    const {
      sku,
      attributes,
      description,
      name,
      price,
      stock,
      images,
      trackStock,
      allowBackorder,
      lowStockThreshold,
      fixedDiscount,
      active,
      order,
    } = req.body;

    // Obtener la variante actual
    const variant = await ProductVariant.findById(id);

    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

    // Actualizar campos
    if (sku !== undefined) variant.sku = sku;
    if (attributes !== undefined) variant.attributes = attributes;
    if (description !== undefined) variant.description = description;
    if (name !== undefined) variant.name = name;
    if (price !== undefined) variant.price = price;
    if (stock !== undefined) variant.stock = stock;
    if (images !== undefined) variant.images = images;
    if (trackStock !== undefined) variant.trackStock = trackStock;
    if (allowBackorder !== undefined) variant.allowBackorder = allowBackorder;
    if (lowStockThreshold !== undefined)
      variant.lowStockThreshold = lowStockThreshold;
    if (fixedDiscount !== undefined) variant.fixedDiscount = fixedDiscount;
    if (active !== undefined) variant.active = active;
    if (order !== undefined) variant.order = order;

    await variant.save();

    return res.status(200).json({
      success: true,
      message: 'Variante actualizada exitosamente',
      data: variant,
    });
  }
);

/**
 * Eliminar ProductVariant
 * DELETE /api/products/variants/:id
 * Role: admin
 */
export const deleteProductVariant = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    const { id } = req.params;

    // Obtener la variante
    const variant = await ProductVariant.findById(id);

    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

    // Verificar que no sea la única variante activa del producto
    const activeVariantsCount = await ProductVariant.countDocuments({
      parentProduct: variant.parentProduct,
      active: true,
    });

    if (activeVariantsCount === 1) {
      throw new AppError(
        400,
        'No se puede eliminar la única variante activa del producto'
      );
    }

    // Soft delete
    variant.active = false;
    await variant.save();

    return res.status(200).json({
      success: true,
      message: 'Variante eliminada exitosamente',
    });
  }
);

/**
 * Obtener preview de descuentos para una variante
 * GET /api/products/variants/:id/discount-preview
 * Role: público
 */
export const getVariantDiscountPreview = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const { id } = req.params;
    const { quantity } = req.query as any;

    // Obtener tier previews (badges para mostrar en UI)
    const tierPreviews = await getVisibleTierPreviews(id);

    // Si se proporciona cantidad, calcular precio específico
    let priceCalculation = null;
    if (quantity) {
      const qty = parseInt(quantity);
      if (qty > 0) {
        priceCalculation = await calculatePriceByQuantity(id, qty);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        tierPreviews,
        priceCalculation,
      },
    });
  }
);

/**
 * Actualizar stock de una variante (solo admin/funcionario)
 * PATCH /api/products/variants/:id/stock
 * Role: admin, funcionario
 */
export const updateVariantStock = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<IProductVariant>>) => {
    const { id } = req.params;
    const { stock } = req.body;

    // Obtener la variante
    const variant = await ProductVariant.findById(id);

    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

    // Actualizar stock directamente
    variant.stock = stock;
    await variant.save();

    return res.status(200).json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: variant,
    });
  }
);

/**
 * Obtener variantes con stock bajo
 * GET /api/products/variants/stock/low
 * Role: admin, funcionario
 */
export const getLowStockVariants = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    const { limit = '50' } = req.query as any;

    const lowStockVariants = await ProductVariant.aggregate([
      {
        $match: {
          active: true,
          trackStock: true,
          $expr: {
            $and: [
              { $gt: ['$stock', 0] },
              { $lte: ['$stock', '$lowStockThreshold'] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'productparents',
          localField: 'parentProduct',
          foreignField: '_id',
          as: 'parent',
        },
      },
      {
        $unwind: '$parent',
      },
      {
        $project: {
          _id: 1,
          sku: 1,
          name: 1,
          stock: 1,
          lowStockThreshold: 1,
          price: 1,
          'parent.name': 1,
          'parent.slug': 1,
        },
      },
      {
        $sort: { stock: 1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    return res.status(200).json({
      success: true,
      data: lowStockVariants,
    });
  }
);

/**
 * Obtener variantes sin stock
 * GET /api/products/variants/stock/out
 * Role: admin, funcionario
 */
export const getOutOfStockVariants = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    const { limit = '50' } = req.query as any;

    const outOfStockVariants = await ProductVariant.aggregate([
      {
        $match: {
          active: true,
          trackStock: true,
          stock: { $lte: 0 },
          allowBackorder: false,
        },
      },
      {
        $lookup: {
          from: 'productparents',
          localField: 'parentProduct',
          foreignField: '_id',
          as: 'parent',
        },
      },
      {
        $unwind: '$parent',
      },
      {
        $project: {
          _id: 1,
          sku: 1,
          name: 1,
          stock: 1,
          price: 1,
          'parent.name': 1,
          'parent.slug': 1,
        },
      },
      {
        $sort: { 'parent.name': 1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    return res.status(200).json({
      success: true,
      data: outOfStockVariants,
    });
  }
);
