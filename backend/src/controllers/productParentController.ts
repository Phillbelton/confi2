import { Response } from 'express';
import ProductParent, { IProductParent } from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';
import { AuthRequest, ApiResponse, PaginatedResponse } from '../types';
import { getVisibleTierPreviews } from '../services/discountService';
import mongoose from 'mongoose';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { uploadImagesHybrid } from '../utils/imageUploadHelper';
import logger from '../config/logger';

/**
 * Controller para ProductParent
 */

/**
 * Crear ProductParent (con o sin variantes)
 * POST /api/products/parents
 * Role: admin, funcionario
 *
 * Soporta dos modos:
 * 1. JSON puro: enviar datos en body
 * 2. Multipart/form-data: enviar datos en body + archivos en req.files
 *
 * Para productos simples, enviar defaultVariant: { price, stock }
 * Esto creará automáticamente una variante default sin atributos
 */
export const createProductParent = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ productParent: IProductParent; defaultVariant?: any }>>) => {
    const {
      name,
      description,
      categories,
      brand,
      images,
      tags,
      seoTitle,
      seoDescription,
      variantAttributes,
      featured,
      defaultVariant, // NUEVO: { price, stock, sku? }
    } = req.body;

    // Procesar archivos de imagen si existen (enfoque híbrido)
    const files = req.files as Express.Multer.File[] | undefined;
    let imageUploadResult = null;

    if (files && files.length > 0) {
      logger.info('Procesando imágenes durante creación de producto', {
        productName: name,
        fileCount: files.length,
      });

      imageUploadResult = await uploadImagesHybrid(files, {
        folder: 'products',
        maxImages: 5,
      });
    }

    // Combinar imágenes del body (si las hay) con las subidas
    const allImages = [
      ...(images || []),
      ...(imageUploadResult?.uploaded || []),
    ];

    // Crear el ProductParent
    const productParent = await ProductParent.create({
      name,
      description,
      categories,
      brand,
      images: allImages,
      tags: tags || [],
      seoTitle,
      seoDescription,
      variantAttributes: variantAttributes || [],
      featured: featured || false,
      active: true,
      createdBy: req.user?.id,
    });

    // Si es producto simple (sin variantAttributes), crear variante default
    let createdVariant = null;
    if (defaultVariant && (!variantAttributes || variantAttributes.length === 0)) {
      createdVariant = await ProductVariant.create({
        parentProduct: productParent._id,
        // name y sku se generan automáticamente en pre-save hooks
        price: defaultVariant.price,
        stock: defaultVariant.stock || 0,
        sku: defaultVariant.sku, // Opcional, será auto-generado si no se provee
        attributes: {}, // Sin atributos para producto simple
        trackStock: defaultVariant.trackStock !== false, // Default true
        allowBackorder: defaultVariant.allowBackorder !== false, // Default true
        lowStockThreshold: defaultVariant.lowStockThreshold || 5,
        active: true,
        createdBy: req.user?.id,
      });
    }

    // Mensaje de respuesta adaptado
    let message = 'Producto creado exitosamente';
    if (imageUploadResult) {
      const uploaded = imageUploadResult.uploaded.length;
      const failed = imageUploadResult.failed.length;
      if (uploaded > 0 && failed > 0) {
        message = `Producto creado. ${uploaded}/${uploaded + failed} imágenes subidas`;
      } else if (uploaded > 0) {
        message = `Producto creado con ${uploaded} imagen(es)`;
      }
    }

    return res.status(201).json({
      success: true,
      message,
      data: {
        productParent: productParent.toObject(),
        ...(createdVariant && { defaultVariant: createdVariant.toObject() }),
      },
    });
  }
);

/**
 * Obtener todos los ProductParents con filtros y paginación
 * GET /api/products/parents
 * Role: público
 */
export const getProductParents = asyncHandler(
  async (
    req: AuthRequest,
    res: Response<ApiResponse<PaginatedResponse<IProductParent>>>
  ) => {
    const {
      page = '1',
      limit = '20',
      category,
      categories,
      brand,
      brands,
      tags,
      search,
      minPrice,
      maxPrice,
      active = 'true',
      featured,
      onSale,
      sort,
    } = req.query as any;

    // Construir filtros
    const filter: any = {};

    // Filtro de activo
    if (active === 'true') {
      filter.active = true;
    }

    // Filtro de categorías (soporta tanto category como categories, tanto string como array)
    const categoryFilter = categories || category;
    if (categoryFilter) {
      // Si es un string separado por comas, convertir a array
      const categoryArray = typeof categoryFilter === 'string'
        ? categoryFilter.split(',').filter(Boolean).map((id: string) => id.trim())
        : Array.isArray(categoryFilter)
        ? categoryFilter
        : [categoryFilter];

      if (categoryArray.length > 0) {
        filter.categories = { $in: categoryArray };
      }
    }

    // Filtro de featured
    if (featured === 'true') {
      filter.featured = true;
    }

    // Filtro de marcas (soporta tanto brand como brands, tanto string como array)
    const brandFilter = brands || brand;
    if (brandFilter) {
      // Si es un string separado por comas, convertir a array
      const brandArray = typeof brandFilter === 'string'
        ? brandFilter.split(',').filter(Boolean).map((id: string) => id.trim())
        : Array.isArray(brandFilter)
        ? brandFilter
        : [brandFilter];

      if (brandArray.length > 0) {
        filter.brand = { $in: brandArray };
      }
    }

    // Filtro de tags
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArray };
    }

    // Búsqueda por texto
    if (search) {
      filter.$text = { $search: search };
    }

    // Calcular paginación
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir sort
    let sortObj: any = { createdAt: -1 }; // default
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortObj = { 'variants.price': 1 };
          break;
        case 'price_desc':
          sortObj = { 'variants.price': -1 };
          break;
        case 'name_asc':
          sortObj = { name: 1 };
          break;
        case 'name_desc':
          sortObj = { name: -1 };
          break;
        case 'newest':
          sortObj = { createdAt: -1 };
          break;
        case 'oldest':
          sortObj = { createdAt: 1 };
          break;
      }
    }

    // Query principal
    let query = ProductParent.find(filter)
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Ejecutar query
    const products = await query;

    // Contar total
    const total = await ProductParent.countDocuments(filter);

    // Si se filtra por precio, necesitamos obtener las variantes
    let filteredProducts = products;

    if (minPrice || maxPrice) {
      const productIds = products.map((p) => p._id);

      // Construir filtro de precio para variantes
      const priceFilter: any = {
        parentProduct: { $in: productIds },
        active: true,
      };

      if (minPrice) {
        priceFilter.price = { $gte: parseFloat(minPrice) };
      }

      if (maxPrice) {
        if (priceFilter.price) {
          priceFilter.price.$lte = parseFloat(maxPrice);
        } else {
          priceFilter.price = { $lte: parseFloat(maxPrice) };
        }
      }

      // Obtener IDs de productos que tienen variantes en el rango de precio
      const variantsInRange = await ProductVariant.find(priceFilter).distinct(
        'parentProduct'
      );

      // Filtrar productos
      filteredProducts = products.filter((p) =>
        variantsInRange.some((v) => v.equals(p._id))
      );
    }

    // Calcular paginación
    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        data: filteredProducts,
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

/**
 * Obtener un ProductParent por ID con variantes populadas
 * GET /api/products/parents/:id
 * Role: público
 */
export const getProductParentById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const { id } = req.params;

    // Obtener el ProductParent
    const productParent = await ProductParent.findById(id)
      .populate('categories', 'name slug parent')
      .populate('brand', 'name slug logo');

    if (!productParent) {
      throw new AppError(404, 'Producto no encontrado');
    }

    // Obtener las variantes
    const variants = await ProductVariant.find({
      parentProduct: id,
      active: true,
    }).sort({ order: 1 });

    // Para cada variante, obtener los tier previews
    const variantsWithPreviews = await Promise.all(
      variants.map(async (variant) => {
        const tierPreviews = await getVisibleTierPreviews(variant._id);
        return {
          ...variant.toObject(),
          tierPreviews,
        };
      })
    );

    // Incrementar views
    productParent.views += 1;
    await productParent.save();

    return res.status(200).json({
      success: true,
      data: {
        ...productParent.toObject(),
        variants: variantsWithPreviews,
      },
    });
  }
);

/**
 * Obtener un ProductParent por slug con variantes populadas
 * GET /api/products/parents/slug/:slug
 * Role: público
 */
export const getProductParentBySlug = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
    const { slug } = req.params;

    // Obtener el ProductParent
    const productParent = await ProductParent.findOne({ slug, active: true })
      .populate('categories', 'name slug parent')
      .populate('brand', 'name slug logo');

    if (!productParent) {
      throw new AppError(404, 'Producto no encontrado');
    }

    // Obtener las variantes
    const variants = await ProductVariant.find({
      parentProduct: productParent._id,
      active: true,
    }).sort({ order: 1 });

    // Para cada variante, obtener los tier previews
    const variantsWithPreviews = await Promise.all(
      variants.map(async (variant) => {
        const tierPreviews = await getVisibleTierPreviews(variant._id);
        return {
          ...variant.toObject(),
          tierPreviews,
        };
      })
    );

    // Incrementar views
    productParent.views += 1;
    await productParent.save();

    return res.status(200).json({
      success: true,
      data: {
        ...productParent.toObject(),
        variants: variantsWithPreviews,
      },
    });
  }
);

/**
 * Actualizar ProductParent
 * PUT /api/products/parents/:id
 * Role: admin, funcionario
 */
export const updateProductParent = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<IProductParent>>) => {
    const { id } = req.params;
    const {
      name,
      description,
      categories,
      brand,
      images,
      tags,
      seoTitle,
      seoDescription,
      variantAttributes,
      featured,
      active,
    } = req.body;

    // Obtener el producto actual
    const productParent = await ProductParent.findById(id);

    if (!productParent) {
      throw new AppError(404, 'Producto no encontrado');
    }

    // Actualizar campos
    if (name !== undefined) productParent.name = name;
    if (description !== undefined) productParent.description = description;

    if (categories !== undefined) {
      // Si es null o undefined, no actualizar. Si es array, convertir a ObjectIds
      if (categories && Array.isArray(categories)) {
        productParent.categories = categories.map(
          (c: string) => new mongoose.Types.ObjectId(c)
        );
      }
    }

    if (brand !== undefined) {
      // Si es null, undefined, o string vacío, asignar undefined (remover brand)
      if (!brand || brand === '') {
        productParent.brand = undefined as any;
      } else {
        productParent.brand = new mongoose.Types.ObjectId(brand);
      }
    }

    if (images !== undefined) productParent.images = images;

    if (tags !== undefined) {
      // Si es null o undefined, no actualizar. Si es array, mantener como está (ya son ObjectIds)
      if (tags && Array.isArray(tags)) {
        productParent.tags = tags;
      }
    }

    if (seoTitle !== undefined) productParent.seoTitle = seoTitle;
    if (seoDescription !== undefined)
      productParent.seoDescription = seoDescription;
    if (variantAttributes !== undefined)
      productParent.variantAttributes = variantAttributes as any;
    if (featured !== undefined) productParent.featured = featured;
    if (active !== undefined) productParent.active = active;

    await productParent.save();

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: productParent,
    });
  }
);

/**
 * Eliminar ProductParent (soft delete)
 * DELETE /api/products/parents/:id
 * Role: admin
 */
export const deleteProductParent = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    const { id } = req.params;

    // Obtener el producto
    const productParent = await ProductParent.findById(id);

    if (!productParent) {
      throw new AppError(404, 'Producto no encontrado');
    }

    // Soft delete
    productParent.active = false;
    await productParent.save();

    // También desactivar todas las variantes
    await ProductVariant.updateMany({ parentProduct: id }, { active: false });

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  }
);

/**
 * Obtener todas las variantes de un ProductParent
 * GET /api/products/parents/:id/variants
 * Role: público
 */
export const getProductParentVariants = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<any[]>>) => {
    const { id } = req.params;
    const { active = 'true' } = req.query as any;

    // Verificar que el producto existe
    const productParent = await ProductParent.findById(id);

    if (!productParent) {
      throw new AppError(404, 'Producto no encontrado');
    }

    // Construir filtro
    const filter: any = { parentProduct: id };
    if (active === 'true') {
      filter.active = true;
    }

    // Obtener las variantes
    const variants = await ProductVariant.find(filter).sort({ order: 1 });

    // Para cada variante, obtener los tier previews
    const variantsWithPreviews = await Promise.all(
      variants.map(async (variant) => {
        const tierPreviews = await getVisibleTierPreviews(variant._id);
        return {
          ...variant.toObject(),
          tierPreviews,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: variantsWithPreviews,
    });
  }
);

/**
 * Obtener productos destacados
 * GET /api/products/parents/featured
 * Role: público
 */
export const getFeaturedProducts = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<IProductParent[]>>) => {
    const { limit = '10' } = req.query as any;

    const products = await ProductParent.find({
      featured: true,
      active: true,
    })
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .sort({ views: -1, createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: products,
    });
  }
);
