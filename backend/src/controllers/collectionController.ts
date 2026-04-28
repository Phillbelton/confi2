import { Response } from 'express';
import Collection, { ICollection } from '../models/Collection';
import ProductParent from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { imageService } from '../services/imageService';
import logger from '../config/logger';

/**
 * Controller para Collection — listas curadas de productos.
 */

// @desc    Listar colecciones
// @route   GET /api/collections
// @access  Public
export const getCollections = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { showOnHome, active = 'true', search } = req.query as Record<
      string,
      string | undefined
    >;

    const filter: any = {};

    if (active === 'true') {
      filter.active = true;
    } else if (active === 'false') {
      filter.active = false;
    }
    // active === 'all' → no filter

    if (showOnHome === 'true') {
      filter.showOnHome = true;
    } else if (showOnHome === 'false') {
      filter.showOnHome = false;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const collections = await Collection.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Para cada colección, contar productos activos (info útil sin populate completo)
    const withCounts = await Promise.all(
      collections.map(async (c) => {
        const productCount = await ProductParent.countDocuments({
          _id: { $in: c.products || [] },
          active: true,
        });
        return { ...c, productCount };
      })
    );

    res.status(200).json({
      success: true,
      data: { collections: withCounts },
    });
  }
);

// @desc    Obtener colección por ID (admin/edit)
// @route   GET /api/collections/:id
// @access  Public
export const getCollectionById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const collection = await Collection.findById(req.params.id)
      .populate('products', 'name slug images active')
      .lean();

    if (!collection) {
      throw new AppError(404, 'Colección no encontrada');
    }

    res.status(200).json({
      success: true,
      data: { collection },
    });
  }
);

// @desc    Obtener colección por slug
// @route   GET /api/collections/slug/:slug
// @access  Public
export const getCollectionBySlug = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const collection = await Collection.findOne({
      slug: req.params.slug,
      active: true,
    }).lean();

    if (!collection) {
      throw new AppError(404, 'Colección no encontrada');
    }

    res.status(200).json({
      success: true,
      data: { collection },
    });
  }
);

// @desc    Obtener productos de una colección (en orden curado, paginado)
// @route   GET /api/collections/slug/:slug/products
// @access  Public
export const getCollectionProducts = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { slug } = req.params;
    const { page = '1', limit = '20' } = req.query as Record<string, string>;

    const collection = await Collection.findOne({ slug, active: true }).lean();
    if (!collection) {
      throw new AppError(404, 'Colección no encontrada');
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const productIds = collection.products || [];
    const total = await ProductParent.countDocuments({
      _id: { $in: productIds },
      active: true,
    });

    // Cargar productos respetando el orden curado
    const products = await ProductParent.find({
      _id: { $in: productIds },
      active: true,
    })
      .populate('categories', 'name slug color icon')
      .populate('brand', 'name slug')
      .lean();

    // Reordenar según el orden de products[]
    const orderMap = new Map(
      productIds.map((id, idx) => [id.toString(), idx])
    );
    products.sort((a: any, b: any) => {
      const ai = orderMap.get(a._id.toString()) ?? 999;
      const bi = orderMap.get(b._id.toString()) ?? 999;
      return ai - bi;
    });

    // Paginar manualmente (después del orden curado)
    const paginated = products.slice(skip, skip + limitNum);

    // Eager-load variants
    const ids = paginated.map((p: any) => p._id);
    const variants = await ProductVariant.find({
      parentProduct: { $in: ids },
      active: true,
    })
      .sort({ order: 1 })
      .lean();

    const byParent = variants.reduce((acc, v) => {
      const k = v.parentProduct.toString();
      if (!acc[k]) acc[k] = [];
      acc[k].push(v);
      return acc;
    }, {} as Record<string, any[]>);

    const productsWithVariants = paginated.map((p: any) => ({
      ...p,
      variants: byParent[p._id.toString()] || [],
    }));

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        collection,
        data: productsWithVariants,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  }
);

// @desc    Crear colección
// @route   POST /api/collections
// @access  Private (admin, funcionario)
export const createCollection = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const {
      name,
      description,
      image,
      emoji,
      gradient,
      products,
      active,
      showOnHome,
      order,
    } = req.body;

    const collection = await Collection.create({
      name,
      description,
      image,
      emoji,
      gradient,
      products: products || [],
      active: active !== undefined ? active : true,
      showOnHome: showOnHome !== undefined ? showOnHome : true,
      order: order !== undefined ? order : 0,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Colección creada exitosamente',
      data: { collection },
    });
  }
);

// @desc    Actualizar colección
// @route   PUT /api/collections/:id
// @access  Private (admin, funcionario)
export const updateCollection = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      throw new AppError(404, 'Colección no encontrada');
    }

    const {
      name,
      description,
      image,
      emoji,
      gradient,
      products,
      active,
      showOnHome,
      order,
    } = req.body;

    if (name !== undefined) collection.name = name;
    if (description !== undefined) collection.description = description;
    if (image !== undefined) {
      // Si cambia o se limpia y la anterior era de Cloudinary, eliminarla
      if (collection.image && collection.image !== image) {
        try {
          await imageService.deleteImage(collection.image);
        } catch (error: any) {
          logger.warn('No se pudo borrar imagen anterior de colección', {
            error: error.message,
            collectionId: collection._id,
          });
        }
      }
      collection.image = image;
    }
    if (emoji !== undefined) collection.emoji = emoji;
    if (gradient !== undefined) collection.gradient = gradient;
    if (products !== undefined) collection.products = products;
    if (active !== undefined) collection.active = active;
    if (showOnHome !== undefined) collection.showOnHome = showOnHome;
    if (order !== undefined) collection.order = order;
    if (req.user?.id) collection.updatedBy = req.user.id as any;

    await collection.save();

    res.status(200).json({
      success: true,
      message: 'Colección actualizada exitosamente',
      data: { collection },
    });
  }
);

// @desc    Eliminar colección (soft delete)
// @route   DELETE /api/collections/:id
// @access  Private (admin)
export const deleteCollection = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      throw new AppError(404, 'Colección no encontrada');
    }

    // Borrar imagen de Cloudinary si existe (best-effort)
    if (collection.image) {
      try {
        await imageService.deleteImage(collection.image);
      } catch (error: any) {
        logger.warn('No se pudo borrar imagen de colección eliminada', {
          error: error.message,
          collectionId: collection._id,
        });
      }
    }

    collection.active = false;
    if (req.user?.id) collection.deletedBy = req.user.id as any;
    await collection.save();

    res.status(200).json({
      success: true,
      message: 'Colección eliminada exitosamente',
    });
  }
);

// @desc    Reordenar colecciones (drag&drop)
// @route   PATCH /api/collections/reorder
// @access  Private (admin, funcionario)
export const reorderCollections = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { items } = req.body as { items: { id: string; order: number }[] };

    const ops = items.map((it) => ({
      updateOne: {
        filter: { _id: it.id },
        update: { $set: { order: it.order, updatedBy: req.user?.id } },
      },
    }));

    if (ops.length > 0) {
      await Collection.bulkWrite(ops as any);
    }

    res.status(200).json({
      success: true,
      message: 'Orden actualizado',
    });
  }
);
