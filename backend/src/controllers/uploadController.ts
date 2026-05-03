import { Response } from 'express';
import fs from 'fs';
import Product from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import Collection from '../models/Collection';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { imageService } from '../services/imageService';
import logger from '../config/logger';

/**
 * Upload Controller — manejo de imágenes para Product, Category, Brand, Collection.
 */

async function uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) {
    try {
      const result = await imageService.uploadImage(f.path, { folder });
      urls.push(result.url);
    } catch (err: any) {
      logger.warn(`[upload] failed ${f.originalname}: ${err.message}`);
    } finally {
      fs.unlink(f.path, () => {});
    }
  }
  return urls;
}

// ============================ Product ============================

export const uploadProductImages = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError(404, 'Producto no encontrado');
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new AppError(400, 'Sin imágenes');
    const slots = Math.max(0, 5 - (product.images?.length || 0));
    if (slots === 0) throw new AppError(400, 'Máximo 5 imágenes');
    const urls = await uploadFiles(files.slice(0, slots), 'products');
    product.images = [...(product.images || []), ...urls];
    await product.save();
    res.status(200).json({
      success: true,
      message: `${urls.length} imagen(es) subida(s)`,
      data: { images: product.images },
    });
  }
);

export const deleteProductImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id, filename } = req.params;
    const product = await Product.findById(id);
    if (!product) throw new AppError(404, 'Producto no encontrado');
    const target = (product.images || []).find((u) => u.includes(filename));
    if (!target) throw new AppError(404, 'Imagen no encontrada');
    try {
      await imageService.deleteImage(target);
    } catch {}
    product.images = (product.images || []).filter((u) => u !== target);
    await product.save();
    res.status(200).json({ success: true, message: 'Imagen eliminada' });
  }
);

// ============================ Category ============================

export const uploadCategoryImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const cat = await Category.findById(req.params.id);
    if (!cat) throw new AppError(404, 'Categoría no encontrada');
    const file = req.file;
    if (!file) throw new AppError(400, 'Sin imagen');
    if (cat.image) {
      try { await imageService.deleteImage(cat.image); } catch {}
    }
    const [url] = await uploadFiles([file], 'categories');
    if (!url) throw new AppError(500, 'Error al subir imagen');
    cat.image = url;
    await cat.save();
    res.status(200).json({ success: true, message: 'Imagen actualizada', data: { image: url } });
  }
);

// ============================ Brand ============================

export const uploadBrandLogo = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) throw new AppError(404, 'Marca no encontrada');
    const file = req.file;
    if (!file) throw new AppError(400, 'Sin imagen');
    if (brand.logo) {
      try { await imageService.deleteImage(brand.logo); } catch {}
    }
    const [url] = await uploadFiles([file], 'brands');
    if (!url) throw new AppError(500, 'Error al subir imagen');
    brand.logo = url;
    await brand.save();
    res.status(200).json({ success: true, message: 'Logo actualizado', data: { logo: url } });
  }
);

// ============================ Collection ============================

export const uploadCollectionImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const coll = await Collection.findById(req.params.id);
    if (!coll) throw new AppError(404, 'Colección no encontrada');
    const file = req.file;
    if (!file) throw new AppError(400, 'Sin imagen');
    if (coll.image) {
      try { await imageService.deleteImage(coll.image); } catch {}
    }
    const [url] = await uploadFiles([file], 'collections');
    if (!url) throw new AppError(500, 'Error al subir imagen');
    coll.image = url;
    await coll.save();
    res.status(200).json({ success: true, message: 'Imagen actualizada', data: { image: url } });
  }
);
