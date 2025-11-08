import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import ProductParent from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import {
  processImage,
  deleteImageVariants,
  validateImageDimensions,
} from '../utils/imageProcessor';
import { getFileUrl, getFilePath, deleteFile } from '../middleware/upload';
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

    // Procesar cada imagen
    const imageUrls: string[] = [];
    for (const file of files) {
      try {
        // Validar dimensiones
        const validation = await validateImageDimensions(file.path, 200, 200, 2000, 2000);
        if (!validation.valid) {
          logger.warn('Imagen rechazada', { filename: file.filename, reason: validation.message });
          await deleteFile(file.path);
          continue;
        }

        // Procesar imagen (optimizar y redimensionar)
        const processedPath = file.path.replace(path.extname(file.path), '-processed.webp');
        await processImage(file.path, processedPath, {
          width: 800,
          height: 800,
          quality: 85,
          format: 'webp',
          fit: 'cover',
        });

        // Eliminar original, usar procesada
        await deleteFile(file.path);

        // Obtener URL relativa
        const imageUrl = getFileUrl(path.basename(processedPath), 'products');
        imageUrls.push(imageUrl);
      } catch (error: any) {
        logger.error('Error procesando imagen individual', {
          filename: file.filename,
          error: error.message,
        });
        await deleteFile(file.path);
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
    const imageUrl = `/uploads/products/${filename}`;
    const imageIndex = product.images?.indexOf(imageUrl) ?? -1;

    if (imageIndex === -1) {
      throw new AppError(404, 'Imagen no encontrada en el producto');
    }

    // Eliminar archivo físico
    const filePath = getFilePath(filename, 'products');
    try {
      await deleteFile(filePath);
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
        const validation = await validateImageDimensions(file.path, 200, 200, 2000, 2000);
        if (!validation.valid) {
          logger.warn('Imagen rechazada', { filename: file.filename, reason: validation.message });
          await deleteFile(file.path);
          continue;
        }

        const processedPath = file.path.replace(path.extname(file.path), '-processed.webp');
        await processImage(file.path, processedPath, {
          width: 800,
          height: 800,
          quality: 85,
          format: 'webp',
          fit: 'cover',
        });

        await deleteFile(file.path);
        const imageUrl = getFileUrl(path.basename(processedPath), 'products');
        imageUrls.push(imageUrl);
      } catch (error: any) {
        logger.error('Error procesando imagen individual', {
          filename: file.filename,
          error: error.message,
        });
        await deleteFile(file.path);
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

    const imageUrl = `/uploads/products/${filename}`;
    const imageIndex = variant.images?.indexOf(imageUrl) ?? -1;

    if (imageIndex === -1) {
      throw new AppError(404, 'Imagen no encontrada en la variante');
    }

    const filePath = getFilePath(filename, 'products');
    try {
      await deleteFile(filePath);
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
      const oldFilename = path.basename(category.image);
      const oldFilePath = getFilePath(oldFilename, 'categories');
      try {
        await deleteFile(oldFilePath);
      } catch (error: any) {
        logger.warn('No se pudo eliminar imagen anterior de categoría', {
          error: error.message,
        });
      }
    }

    // Procesar nueva imagen
    const processedPath = file.path.replace(path.extname(file.path), '-processed.webp');
    await processImage(file.path, processedPath, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp',
      fit: 'cover',
    });

    await deleteFile(file.path);
    const imageUrl = getFileUrl(path.basename(processedPath), 'categories');

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
      const oldFilename = path.basename(brand.logo);
      const oldFilePath = getFilePath(oldFilename, 'brands');
      try {
        await deleteFile(oldFilePath);
      } catch (error: any) {
        logger.warn('No se pudo eliminar logo anterior de marca', {
          error: error.message,
        });
      }
    }

    // Procesar nuevo logo
    const processedPath = file.path.replace(path.extname(file.path), '-processed.webp');
    await processImage(file.path, processedPath, {
      width: 300,
      height: 300,
      quality: 90,
      format: 'webp',
      fit: 'contain', // Mantener aspecto para logos
    });

    await deleteFile(file.path);
    const logoUrl = getFileUrl(path.basename(processedPath), 'brands');

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
