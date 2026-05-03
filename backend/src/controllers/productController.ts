import { Response } from 'express';
import mongoose from 'mongoose';
import Product, { IProduct } from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import Collection from '../models/Collection';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { imageService } from '../services/imageService';
import fs from 'fs';
import logger from '../config/logger';

/**
 * Controllers para Product (modelo plano Quelita).
 * Reemplaza productParentController + productVariantController.
 */

interface ProductListResponse {
  data: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================================
// GET /api/products  (listado público)
// =====================================================
export const listProducts = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<ProductListResponse>>) => {
    const {
      page = '1',
      limit = '20',
      category,
      categories,
      subcategory,
      brand,
      brands,
      format,
      flavor,
      minPrice,
      maxPrice,
      active = 'true',
      featured,
      onSale,
      search,
      collection: collectionSlug,
      sort = 'newest',
    } = req.query as Record<string, string | undefined>;

    const filter: any = {};
    if (active === 'true') filter.active = true;
    else if (active === 'false') filter.active = false;

    // Categoría — acepta slug o ID, y string o array
    const catRaw = subcategory || categories || category;
    if (catRaw) {
      const catList = catRaw.split(',').filter(Boolean).map((s) => s.trim());
      const ids: mongoose.Types.ObjectId[] = [];
      for (const c of catList) {
        if (mongoose.Types.ObjectId.isValid(c)) {
          ids.push(new mongoose.Types.ObjectId(c));
        } else {
          const cat = await Category.findOne({ slug: c, active: true }).select('_id').lean();
          if (cat) ids.push(cat._id as mongoose.Types.ObjectId);
        }
      }
      if (ids.length > 0) {
        // Expandir a descendientes (3 niveles): ?categoria=helados trae también Cassata, etc.
        const allIds: mongoose.Types.ObjectId[] = [];
        for (const id of ids) {
          const desc = await (Category as any).getDescendantIds(id);
          allIds.push(...desc);
        }
        filter.categories = { $in: allIds };
      } else {
        filter._id = { $in: [] };
      }
    }

    // Marca — slug o id, single o multi
    const brandRaw = brands || brand;
    if (brandRaw) {
      const brandList = brandRaw.split(',').filter(Boolean).map((s) => s.trim());
      const ids: mongoose.Types.ObjectId[] = [];
      for (const b of brandList) {
        if (mongoose.Types.ObjectId.isValid(b)) ids.push(new mongoose.Types.ObjectId(b));
        else {
          const found = await Brand.findOne({ slug: b, active: true }).select('_id').lean();
          if (found) ids.push(found._id as mongoose.Types.ObjectId);
        }
      }
      if (ids.length > 0) filter.brand = { $in: ids };
    }

    // Formato y sabor — siempre por ID o slug
    if (format) {
      if (mongoose.Types.ObjectId.isValid(format)) {
        filter.format = new mongoose.Types.ObjectId(format);
      } else {
        const f: any = await mongoose.model('Format').findOne({ slug: format }).select('_id').lean();
        if (f) filter.format = f._id;
      }
    }
    if (flavor) {
      if (mongoose.Types.ObjectId.isValid(flavor)) {
        filter.flavor = new mongoose.Types.ObjectId(flavor);
      } else {
        const f: any = await mongoose.model('Flavor').findOne({ slug: flavor }).select('_id').lean();
        if (f) filter.flavor = f._id;
      }
    }

    if (featured === 'true') filter.featured = true;

    if (minPrice || maxPrice) {
      filter.unitPrice = {};
      if (minPrice) filter.unitPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.unitPrice.$lte = parseFloat(maxPrice);
    }

    if (onSale === 'true') {
      filter.$or = [
        { 'tiers.0': { $exists: true } },
        { 'fixedDiscount.enabled': true },
      ];
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Filtros dinámicos `attr_<key>=v1,v2` → attributes.<key>: { $in: [...] }
    for (const [qKey, qValRaw] of Object.entries(req.query as Record<string, any>)) {
      if (!qKey.startsWith('attr_') || qValRaw == null) continue;
      const attrKey = qKey.slice(5);
      if (!attrKey) continue;
      const values = String(qValRaw)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length > 0) {
        filter[`attributes.${attrKey}`] = { $in: values };
      }
    }

    // Colección — intersect con products[]
    if (collectionSlug) {
      const coll = await Collection.findOne({ slug: collectionSlug, active: true })
        .select('products')
        .lean();
      if (coll && coll.products?.length) {
        filter._id = { $in: coll.products };
      } else {
        filter._id = { $in: [] };
      }
    }

    // Sort
    let sortObj: any = { createdAt: -1 };
    switch (sort) {
      case 'price_asc': sortObj = { unitPrice: 1 }; break;
      case 'price_desc': sortObj = { unitPrice: -1 }; break;
      case 'name_asc': sortObj = { name: 1 }; break;
      case 'name_desc': sortObj = { name: -1 }; break;
      case 'oldest': sortObj = { createdAt: 1 }; break;
      case 'popular': sortObj = { views: -1, createdAt: -1 }; break;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('categories', 'name slug color icon')
        .populate('brand', 'name slug')
        .populate('format', 'label value unit slug')
        .populate('flavor', 'name slug color')
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: {
        data: data as any,
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

// =====================================================
// GET /api/products/featured
// =====================================================
export const listFeaturedProducts = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ data: IProduct[] }>>) => {
    const limit = parseInt((req.query.limit as string) || '8');
    const data = await Product.find({ featured: true, active: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .populate('format', 'label value unit')
      .populate('flavor', 'name')
      .lean();
    res.status(200).json({ success: true, data: { data: data as any } });
  }
);

// =====================================================
// GET /api/products/:id
// =====================================================
export const getProductById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ product: IProduct }>>) => {
    const product = await Product.findById(req.params.id)
      .populate('categories', 'name slug color icon parent')
      .populate('brand', 'name slug logo')
      .populate('format', 'label value unit slug')
      .populate('flavor', 'name slug color')
      .lean();
    if (!product) throw new AppError(404, 'Producto no encontrado');
    res.status(200).json({ success: true, data: { product: product as any } });
  }
);

// =====================================================
// GET /api/products/slug/:slug
// =====================================================
export const getProductBySlug = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ product: IProduct }>>) => {
    const product = await Product.findOne({ slug: req.params.slug, active: true })
      .populate('categories', 'name slug color icon parent')
      .populate('brand', 'name slug logo')
      .populate('format', 'label value unit slug')
      .populate('flavor', 'name slug color')
      .lean();
    if (!product) throw new AppError(404, 'Producto no encontrado');

    // Increment views fire-and-forget
    Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).catch(() => {});

    res.status(200).json({ success: true, data: { product: product as any } });
  }
);

// =====================================================
// POST /api/products
// =====================================================
export const createProduct = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ product: IProduct }>>) => {
    const body = req.body;

    const files = req.files as Express.Multer.File[] | undefined;
    const allImages: string[] = Array.isArray(body.images) ? [...body.images] : [];
    if (files && files.length > 0) {
      const slots = Math.max(0, 5 - allImages.length);
      for (const f of files.slice(0, slots)) {
        try {
          const result = await imageService.uploadImage(f.path, { folder: 'products' });
          allImages.push(result.url);
        } catch (err: any) {
          logger.warn('[product] Image upload failed', { file: f.originalname, err: err.message });
        } finally {
          fs.unlink(f.path, () => {});
        }
      }
    }

    const product = await Product.create({
      ...body,
      images: allImages,
      tiers: body.tiers || [],
      createdBy: req.user?.id,
    });

    logger.info('[product] Created', { id: product._id, name: product.name });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { product },
    });
  }
);

// =====================================================
// PUT /api/products/:id
// =====================================================
export const updateProduct = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ product: IProduct }>>) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError(404, 'Producto no encontrado');

    const body = req.body;
    const fields = [
      'name', 'description', 'categories', 'brand', 'format', 'flavor',
      'barcode', 'provider', 'unitPrice', 'saleUnit', 'tiers',
      'fixedDiscount', 'images', 'featured', 'active',
    ];
    for (const field of fields) {
      if (body[field] !== undefined) (product as any)[field] = body[field];
    }
    if (req.user?.id) product.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { product },
    });
  }
);

// =====================================================
// DELETE /api/products/:id  (soft delete)
// =====================================================
export const deleteProduct = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError(404, 'Producto no encontrado');
    product.active = false;
    if (req.user?.id) product.deletedBy = new mongoose.Types.ObjectId(req.user.id);
    await product.save();
    res.status(200).json({ success: true, message: 'Producto eliminado exitosamente' });
  }
);
