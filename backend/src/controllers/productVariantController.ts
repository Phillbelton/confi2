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
      tieredDiscount,
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
    if (tieredDiscount !== undefined) variant.tieredDiscount = tieredDiscount;
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

    // Obtener la variante para acceder a su fixedDiscount
    const variant = await ProductVariant.findById(id);
    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

    // Información de fixed discount
    const originalPrice = variant.price;
    let hasDiscount = false;
    let discountedPrice = originalPrice;
    let discountType: 'percentage' | 'amount' | null = null;
    let discountValue: number | null = null;
    let badge: string | null = null;

    if (variant.fixedDiscount?.enabled) {
      const now = new Date();
      const startValid = !variant.fixedDiscount.startDate || variant.fixedDiscount.startDate <= now;
      const endValid = !variant.fixedDiscount.endDate || variant.fixedDiscount.endDate >= now;

      if (startValid && endValid) {
        hasDiscount = true;
        discountType = variant.fixedDiscount.type;
        discountValue = variant.fixedDiscount.value;
        badge = variant.fixedDiscount.badge || null;

        if (discountType === 'percentage') {
          discountedPrice = originalPrice - (originalPrice * discountValue / 100);
        } else {
          discountedPrice = originalPrice - discountValue;
        }
      }
    }

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
        originalPrice,
        discountedPrice,
        hasDiscount,
        discountType,
        discountValue,
        badge,
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

/**
 * Crear variantes en batch (múltiples a la vez)
 * POST /api/products/parents/:id/variants/batch
 * Role: admin, funcionario
 *
 * Body: {
 *   variants: [
 *     { attributes: {...}, price: 5000, stock: 10, sku?: "...", images?: [...] },
 *     { attributes: {...}, price: 3000, stock: 20, sku?: "...", images?: [...] },
 *     ...
 *   ]
 * }
 *
 * Returns: {
 *   created: [...],  // Variantes creadas exitosamente
 *   failed: [...],   // Variantes que fallaron con error
 * }
 */
export const createVariantsBatch = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{
    created: IProductVariant[];
    failed: Array<{ index: number; data: any; error: string }>;
  }>>) => {
    const { id: parentProductId } = req.params;
    const { variants } = req.body;

    // Validaciones básicas
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      throw new AppError(400, 'Debe proporcionar un array de variantes');
    }

    // Verificar que el producto padre existe
    const parent = await ProductParent.findById(parentProductId);
    if (!parent) {
      throw new AppError(404, 'Producto padre no encontrado');
    }

    const created: IProductVariant[] = [];
    const failed: Array<{ index: number; data: any; error: string }> = [];

    // Procesar cada variante (enfoque híbrido: best effort)
    for (let i = 0; i < variants.length; i++) {
      const variantData = variants[i];

      try {
        // Validar campos requeridos
        if (variantData.price === undefined || variantData.stock === undefined) {
          throw new Error('Faltan campos requeridos (price, stock)');
        }

        // Crear la variante
        const variant = await ProductVariant.create({
          parentProduct: parentProductId,
          sku: variantData.sku, // Opcional, se auto-genera si no se provee
          attributes: variantData.attributes || {},
          description: variantData.description,
          price: variantData.price,
          stock: variantData.stock,
          images: variantData.images || [],
          trackStock: variantData.trackStock !== false,
          allowBackorder: variantData.allowBackorder !== false,
          lowStockThreshold: variantData.lowStockThreshold || 5,
          fixedDiscount: variantData.fixedDiscount,
          order: variantData.order || i,
          active: true,
          createdBy: req.user?.id,
        });

        created.push(variant);
      } catch (error: any) {
        // Si una variante falla, continuar con las demás
        failed.push({
          index: i,
          data: variantData,
          error: error.message || 'Error desconocido',
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `${created.length}/${variants.length} variantes creadas exitosamente`,
      data: {
        created,
        failed,
      },
    });
  }
);

/**
 * Agregar una variante individual a un producto existente
 * POST /api/products/parents/:id/variants
 * Role: admin, funcionario
 *
 * Features:
 * - Valida que no exista una variante con la misma combinación de atributos
 * - Valida que los atributos (keys) existan en parent.variantAttributes
 * - Sincroniza automáticamente: agrega nuevos valores a parent.variantAttributes si no existen
 * - Mantiene la inmutabilidad de SKU (se genera una sola vez)
 */
export const addVariantToParent = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id: parentProductId } = req.params;
    const { attributes, price, stock, sku, description, lowStockThreshold } = req.body;

    // Validaciones básicas
    if (price === undefined || stock === undefined) {
      throw new AppError(400, 'Faltan campos requeridos (price, stock)');
    }

    if (!attributes || typeof attributes !== 'object' || Object.keys(attributes).length === 0) {
      throw new AppError(400, 'Debe proporcionar atributos para la variante');
    }

    // Verificar que el producto padre existe
    const parent = await ProductParent.findById(parentProductId);
    if (!parent) {
      throw new AppError(404, 'Producto padre no encontrado');
    }

    // Verificar que el producto tiene variantAttributes configurados
    if (!parent.variantAttributes || parent.variantAttributes.length === 0) {
      throw new AppError(
        400,
        'Este producto no tiene atributos de variantes configurados. No se pueden agregar variantes.'
      );
    }

    // VALIDACIÓN 1: Verificar que los atributos (keys) de la variante existen en parent.variantAttributes
    const parentAttributeNames = parent.variantAttributes.map((attr) => attr.name);
    const variantAttributeKeys = Object.keys(attributes);

    for (const key of variantAttributeKeys) {
      if (!parentAttributeNames.includes(key)) {
        throw new AppError(
          400,
          `El atributo "${key}" no existe en los atributos del producto. Atributos disponibles: ${parentAttributeNames.join(', ')}`
        );
      }
    }

    // Verificar que todos los atributos requeridos están presentes
    if (variantAttributeKeys.length !== parentAttributeNames.length) {
      throw new AppError(
        400,
        `Debe proporcionar todos los atributos. Requeridos: ${parentAttributeNames.join(', ')}`
      );
    }

    // VALIDACIÓN 2: Verificar que no exista una variante con la misma combinación de atributos
    const existingVariants = await ProductVariant.find({
      parentProduct: parentProductId,
      active: true,
    });

    for (const existingVariant of existingVariants) {
      const existingAttrs = existingVariant.attributes as any;
      const existingAttrsObj = existingAttrs instanceof Map
        ? Object.fromEntries(existingAttrs)
        : existingAttrs;

      // Comparar combinaciones
      const isSameCombination = variantAttributeKeys.every(
        (key) => existingAttrsObj[key] === attributes[key]
      );

      if (isSameCombination) {
        throw new AppError(
          400,
          `Ya existe una variante con esta combinación de atributos: ${JSON.stringify(attributes)}`
        );
      }
    }

    // SINCRONIZACIÓN: Detectar y agregar nuevos valores a parent.variantAttributes
    let parentUpdated = false;
    const newValuesAdded: Array<{ attribute: string; value: string }> = [];

    for (const [attrName, attrValue] of Object.entries(attributes)) {
      // Encontrar el atributo en parent.variantAttributes
      const parentAttr = parent.variantAttributes.find((attr) => attr.name === attrName);

      if (!parentAttr) {
        // Esto no debería pasar por la validación anterior, pero por seguridad
        continue;
      }

      // Verificar si el valor existe en los values del atributo
      const valueExists = parentAttr.values.some((v) => v.value === attrValue);

      if (!valueExists) {
        // Agregar el nuevo valor
        const newOrder = parentAttr.values.length; // Agregar al final
        parentAttr.values.push({
          value: attrValue as string,
          displayValue: attrValue as string,
          order: newOrder,
        });

        parentUpdated = true;
        newValuesAdded.push({
          attribute: attrName,
          value: attrValue as string,
        });
      }
    }

    // Actualizar el parent si se agregaron nuevos valores
    if (parentUpdated) {
      await parent.save();
    }

    // Crear la variante
    const variant = await ProductVariant.create({
      parentProduct: parentProductId,
      sku, // Opcional, se auto-genera si no se provee
      attributes,
      description,
      price,
      stock,
      trackStock: true,
      allowBackorder: true,
      lowStockThreshold: lowStockThreshold || 5,
      active: true,
      createdBy: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: parentUpdated
        ? `Variante creada exitosamente. Se agregaron ${newValuesAdded.length} nuevo(s) valor(es) a los atributos del producto.`
        : 'Variante creada exitosamente',
      data: variant,
    });
  }
);

/**
 * Obtener variantes con filtros y búsqueda
 * GET /api/products/variants?search=...&active=...&limit=...&page=...
 * Role: Public
 */
export const getProductVariants = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const {
      search,
      active,
      limit = '50',
      page = '1',
      parentProduct
    } = req.query;

    const limitNum = parseInt(limit as string, 10) || 50;
    const pageNum = parseInt(page as string, 10) || 1;
    const skip = (pageNum - 1) * limitNum;

    // Construir query
    const query: any = {};

    // Filtro por activo
    if (active === 'true') {
      query.active = true;
    } else if (active === 'false') {
      query.active = false;
    }

    // Filtro por producto padre
    if (parentProduct) {
      query.parentProduct = parentProduct;
    }

    // Búsqueda por texto (nombre y SKU)
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
      ];
    }

    // Ejecutar query con paginación
    const [variants, total] = await Promise.all([
      ProductVariant.find(query)
        .populate('parentProduct', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProductVariant.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        data: variants,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  }
);
