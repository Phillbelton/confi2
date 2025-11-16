import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import ProductParent from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { imageService } from '../services/imageService';
import { deleteFile } from '../middleware/upload';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import path from 'path';

/**
 * Upload Controller
 * Manejo de subida de imágenes para productos, categorías y marcas
 */

/**
 * Subir imágenes a ProductParent
 * POST /api/products/parents/:id/images
 * Role: admin, funcionario
 */
export const uploadProductParentImages = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ images: string[] }>>) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError(400, 'No se subieron archivos');
    }

    // Verificar que el producto existe
    const product = await ProductParent.findById(id);
    if (!product) {
      // Eliminar archivos subidos si el producto no existe
      await Promise.all(files.map((file) => deleteFile(file.path)));
      throw new AppError(404, 'Producto no encontrado');
    }

    // Validar que no exceda el máximo de imágenes (5)
    const currentImages = product.images?.length || 0;
    const newImages = files.length;
    if (currentImages + newImages > 5) {
      // Eliminar archivos subidos
      await Promise.all(files.map((file) => deleteFile(file.path)));
      throw new AppError(
        400,
        `El producto ya tiene ${currentImages} imágenes. Máximo 5 imágenes por producto.`
      );
    }

    // Procesar cada imagen con el servicio de imágenes
    const imageUrls: string[] = [];
    for (const file of files) {
      try {
        // Usar imageService para procesar y subir la imagen
        const result = await imageService.uploadImage(file.path, {
          folder: 'products',
          width: 800,
          height: 800,
          quality: 85,
          format: 'webp',
          validateDimensions: {
            minWidth: 200,
            minHeight: 200,
            maxWidth: 2000,
            maxHeight: 2000,
          },
        });

        imageUrls.push(result.url);
      } catch (error: any) {
        logger.error('Error procesando imagen individual', {
          filename: file.filename,
          error: error.message,
        });
        // El imageService ya maneja la limpieza de archivos
      }
    }

    if (imageUrls.length === 0) {
      throw new AppError(400, 'No se pudo procesar ninguna imagen');
    }

    // Actualizar producto con las nuevas imágenes
    product.images = [...(product.images || []), ...imageUrls];
    if (req.user?.id) {
      product.updatedBy = req.user.id as any;
    }
    await product.save();

    logger.info('Imágenes subidas a ProductParent', {
      productId: id,
      count: imageUrls.length,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: `${imageUrls.length} imagen(es) subida(s) exitosamente`,
      data: { images: product.images },
    });
  }
);

/**
 * Eliminar imagen de ProductParent
 * DELETE /api/products/parents/:id/images/:filename
 * Role: admin, funcionario
 */
export const deleteProductParentImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ images: string[] }>>) => {
    const { id, filename } = req.params;

    const product = await ProductParent.findById(id);
    if (!product) {
      throw new AppError(404, 'Producto no encontrado');
    }

    // Buscar la imagen en el array
    const imageUrl = product.images?.find((img) => img.includes(filename));

    if (!imageUrl) {
      throw new AppError(404, 'Imagen no encontrada en el producto');
    }

    const imageIndex = product.images?.indexOf(imageUrl) ?? -1;

    // Eliminar usando imageService (maneja tanto Cloudinary como local)
    try {
      await imageService.deleteImage(imageUrl);
    } catch (error: any) {
      logger.warn('No se pudo eliminar archivo físico', { filename, error: error.message });
    }

    // Eliminar de la base de datos
    product.images?.splice(imageIndex, 1);
    if (req.user?.id) {
      product.updatedBy = req.user.id as any;
    }
    await product.save();

    logger.info('Imagen eliminada de ProductParent', {
      productId: id,
      filename,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      data: { images: product.images || [] },
    });
  }
);

/**
 * Subir imágenes a ProductVariant
 * POST /api/products/variants/:id/images
 * Role: admin, funcionario
 */
export const uploadProductVariantImages = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ images: string[] }>>) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError(400, 'No se subieron archivos');
    }

    const variant = await ProductVariant.findById(id);
    if (!variant) {
      await Promise.all(files.map((file) => deleteFile(file.path)));
      throw new AppError(404, 'Variante no encontrada');
    }

    const currentImages = variant.images?.length || 0;
    const newImages = files.length;
    if (currentImages + newImages > 5) {
      await Promise.all(files.map((file) => deleteFile(file.path)));
      throw new AppError(
        400,
        `La variante ya tiene ${currentImages} imágenes. Máximo 5 imágenes.`
      );
    }

    const imageUrls: string[] = [];
    for (const file of files) {
      try {
        // Usar imageService para procesar y subir la imagen
        const result = await imageService.uploadImage(file.path, {
          folder: 'products',
          width: 800,
          height: 800,
          quality: 85,
          format: 'webp',
          validateDimensions: {
            minWidth: 200,
            minHeight: 200,
            maxWidth: 2000,
            maxHeight: 2000,
          },
        });

        imageUrls.push(result.url);
      } catch (error: any) {
        logger.error('Error procesando imagen individual', {
          filename: file.filename,
          error: error.message,
        });
        // El imageService ya maneja la limpieza de archivos
      }
    }

    if (imageUrls.length === 0) {
      throw new AppError(400, 'No se pudo procesar ninguna imagen');
    }

    variant.images = [...(variant.images || []), ...imageUrls];
    await variant.save();

    logger.info('Imágenes subidas a ProductVariant', {
      variantId: id,
      count: imageUrls.length,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: `${imageUrls.length} imagen(es) subida(s) exitosamente`,
      data: { images: variant.images },
    });
  }
);

/**
 * Eliminar imagen de ProductVariant
 * DELETE /api/products/variants/:id/images/:filename
 * Role: admin, funcionario
 */
export const deleteProductVariantImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ images: string[] }>>) => {
    const { id, filename } = req.params;

    const variant = await ProductVariant.findById(id);
    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

    const imageUrl = variant.images?.find((img) => img.includes(filename));

    if (!imageUrl) {
      throw new AppError(404, 'Imagen no encontrada en la variante');
    }

    const imageIndex = variant.images?.indexOf(imageUrl) ?? -1;

    // Eliminar usando imageService (maneja tanto Cloudinary como local)
    try {
      await imageService.deleteImage(imageUrl);
    } catch (error: any) {
      logger.warn('No se pudo eliminar archivo físico', { filename, error: error.message });
    }

    variant.images?.splice(imageIndex, 1);
    await variant.save();

    logger.info('Imagen eliminada de ProductVariant', {
      variantId: id,
      filename,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      data: { images: variant.images || [] },
    });
  }
);

/**
 * Subir imagen a Categoría
 * POST /api/categories/:id/image
 * Role: admin, funcionario
 */
export const uploadCategoryImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ image: string }>>) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError(400, 'No se subió ningún archivo');
    }

    const category = await Category.findById(id);
    if (!category) {
      await deleteFile(file.path);
      throw new AppError(404, 'Categoría no encontrada');
    }

    // Eliminar imagen anterior si existe
    if (category.image) {
      try {
        await imageService.deleteImage(category.image);
      } catch (error: any) {
        logger.warn('No se pudo eliminar imagen anterior de categoría', {
          error: error.message,
        });
      }
    }

    // Subir nueva imagen usando imageService
    const result = await imageService.uploadImage(file.path, {
      folder: 'categories',
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp',
    });

    const imageUrl = result.url;

    category.image = imageUrl;
    await category.save();

    logger.info('Imagen subida a categoría', {
      categoryId: id,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: { image: imageUrl },
    });
  }
);

/**
 * Subir logo a Marca
 * POST /api/brands/:id/logo
 * Role: admin, funcionario
 */
export const uploadBrandLogo = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<{ logo: string }>>) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError(400, 'No se subió ningún archivo');
    }

    const brand = await Brand.findById(id);
    if (!brand) {
      await deleteFile(file.path);
      throw new AppError(404, 'Marca no encontrada');
    }

    // Eliminar logo anterior si existe
    if (brand.logo) {
      try {
        await imageService.deleteImage(brand.logo);
      } catch (error: any) {
        logger.warn('No se pudo eliminar logo anterior de marca', {
          error: error.message,
        });
      }
    }

    // Subir nuevo logo usando imageService
    const result = await imageService.uploadImage(file.path, {
      folder: 'brands',
      width: 300,
      height: 300,
      quality: 90,
      format: 'webp',
    });

    const logoUrl = result.url;

    brand.logo = logoUrl;
    await brand.save();

    logger.info('Logo subido a marca', {
      brandId: id,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Logo subido exitosamente',
      data: { logo: logoUrl },
    });
  }
);
