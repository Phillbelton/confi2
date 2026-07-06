import { Response } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import Product from '../models/Product';
import ProductImage from '../models/ProductImage';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import Collection from '../models/Collection';
import Banner from '../models/Banner';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { imageService } from '../services/imageService';
import { processAspectCropMultiSize } from '../utils/imageProcessor';
import { getFileUrl } from '../middleware/upload';
import { ENV } from '../config/env';
import logger from '../config/logger';

/**
 * Upload Controller — manejo de imágenes para Product, Category, Brand, Collection.
 */

/**
 * Multi-size widths por carpeta. Sharp genera 3 variantes WebP (fit:inside, no
 * upscale) que el frontend usa vía `<img srcset>` — browser elige la óptima
 * por device y viewport, ahorrando bandwidth en mobile.
 *
 * Anchos elegidos:
 *  - card  [400, 800, 1200]: cards de catálogo (productos, colecciones, categorías)
 *  - thumb [200, 400]:        logos marcas, cart items
 *  - hero  [640, 1280, 1920]: banners home, backgrounds full-width
 *
 * Naming output: `<base>-w400.webp`, `<base>-w800.webp`, `<base>-w1200.webp`.
 * El DB guarda la URL de la variante intermedia (default src para no-srcset clients).
 */
const FOLDER_WIDTHS: Record<string, number[]> = {
  products:    [400, 800, 1200],
  brands:      [200, 400, 600],
  categories:  [400, 800],
  collections: [400, 800, 1200],
  banners:     [640, 1280, 1920],
  backgrounds: [640, 1280, 1920],
};

async function uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
  const responsiveWidths = FOLDER_WIDTHS[folder] || [400, 800, 1200];
  const urls: string[] = [];
  for (const f of files) {
    try {
      const result = await imageService.uploadImage(f.path, {
        folder,
        responsiveWidths,
      });
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
    if (!product.sku) throw new AppError(400, 'El producto no tiene SKU — requerido para persistir imágenes');

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new AppError(400, 'Sin imágenes');

    const slots = Math.max(0, 5 - (product.images?.length || 0));
    if (slots === 0) throw new AppError(400, 'Máximo 5 imágenes');

    const urls = await uploadFiles(files.slice(0, slots), 'products');
    if (urls.length === 0) throw new AppError(500, 'Error al subir imagen(es)');

    // 1) Persistir en ProductImage (verdad) — sobrevive wipes de Product
    const startOrder = product.images?.length || 0;
    const userId = (req.user as any)?.id;
    const created = await ProductImage.insertMany(
      urls.map((url, i) => ({
        sku: product.sku,
        url,
        order: startOrder + i,
        uploadedBy: userId || undefined,
      })),
      { ordered: false }
    ).catch((e: any) => {
      // Duplicate key (sku+url) — log y seguir
      logger.warn('[ProductImage] insertMany partial: ' + e.message);
      return [];
    });

    // 2) Cache denormalizado en Product.images para queries rápidas
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

    // Borrar archivo en disco
    try {
      await imageService.deleteImage(target);
    } catch {}

    // Borrar registro persistente en ProductImage
    if (product.sku) {
      await ProductImage.deleteOne({ sku: product.sku, url: target }).catch(() => {});
    }

    // Actualizar cache denormalizado
    product.images = (product.images || []).filter((u) => u !== target);
    await product.save();

    res.status(200).json({ success: true, message: 'Imagen eliminada' });
  }
);

// ============================ Category ============================

/**
 * Especificación de los 3 encuadres de imagen de una categoría.
 * Cada variante se recorta (cover, gravedad attention) a su aspect ratio y
 * se emite multi-size `-w<N>.webp` para `<img srcset>`.
 *
 *  - thumb        1:1  → avatar en admin, mega-menú del navbar
 *  - banner       20:3 → hero del catálogo desktop (~2000×300, tipo huincha)
 *  - bannerMobile 5:2  → hero del catálogo mobile (~1000×400)
 */
const CATEGORY_IMAGE_VARIANTS = {
  thumb:        { field: 'image' as const,             aspect: { w: 1, h: 1 },  widths: [200, 400, 800] },
  banner:       { field: 'bannerImage' as const,       aspect: { w: 20, h: 3 }, widths: [1280, 1600, 2000] },
  bannerMobile: { field: 'bannerImageMobile' as const, aspect: { w: 5, h: 2 },  widths: [640, 1000] },
};

type CategoryVariantKey = keyof typeof CATEGORY_IMAGE_VARIANTS;

/**
 * Genera una variante recortada y devuelve su URL pública.
 *
 * Storage local: escribe las multi-size directo en UPLOAD_DIR/categories.
 * Cloudinary: recorta al ancho máximo en un temp y lo sube vía imageService.
 */
async function generateCategoryVariant(
  inputBuffer: Buffer,
  tempDir: string,
  baseName: string,
  variant: CategoryVariantKey
): Promise<string> {
  const spec = CATEGORY_IMAGE_VARIANTS[variant];
  const suffixed = `${baseName}-${variant.toLowerCase()}`;

  if (!ENV.USE_CLOUDINARY) {
    const targetDir = path.join(ENV.UPLOAD_DIR, 'categories');
    await fsp.mkdir(targetDir, { recursive: true });
    const { baseFilename } = await processAspectCropMultiSize(
      inputBuffer, targetDir, suffixed, spec.aspect, spec.widths
    );
    return getFileUrl(baseFilename, 'categories');
  }

  // Cloudinary: generar el recorte al ancho máximo en un temp y subirlo
  // (el servicio borra el temp tras subir).
  const maxW = Math.max(...spec.widths);
  const { paths } = await processAspectCropMultiSize(
    inputBuffer, tempDir, suffixed, spec.aspect, [maxW]
  );
  const result = await imageService.uploadImage(paths[0], { folder: 'categories' });
  return result.url;
}

export const uploadCategoryImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const cat = await Category.findById(req.params.id);
    if (!cat) throw new AppError(404, 'Categoría no encontrada');
    const file = req.file;
    if (!file) throw new AppError(400, 'Sin imagen');

    // ?variant=thumb|banner|bannerMobile actualiza UN encuadre;
    // ?variant=master genera los 3 desde la misma imagen.
    // Default 'thumb' (compat con el flujo previo, que seteaba `image`).
    const variant = (req.query.variant as string) || 'thumb';
    const isMaster = variant === 'master';
    if (!isMaster && !(variant in CATEGORY_IMAGE_VARIANTS)) {
      throw new AppError(400, `variant inválido: ${variant} (thumb | banner | bannerMobile | master)`);
    }

    const targets: CategoryVariantKey[] = isMaster
      ? (Object.keys(CATEGORY_IMAGE_VARIANTS) as CategoryVariantKey[])
      : [variant as CategoryVariantKey];

    try {
      // Buffer en memoria una sola vez (evita el lock EBUSY de Windows y
      // permite reusar el original para los 3 encuadres).
      const inputBuffer = await fsp.readFile(file.path);
      const baseName = path.basename(file.path, path.extname(file.path));
      const tempDir = path.dirname(file.path);

      for (const key of targets) {
        const spec = CATEGORY_IMAGE_VARIANTS[key];
        const oldUrl = cat[spec.field];
        const url = await generateCategoryVariant(inputBuffer, tempDir, baseName, key);
        if (oldUrl) {
          try { await imageService.deleteImage(oldUrl); } catch {}
        }
        cat[spec.field] = url;
      }
    } catch (err: any) {
      logger.error('[upload] category variant failed', { error: err.message });
      throw new AppError(500, 'Error al procesar imagen de categoría');
    } finally {
      fs.unlink(file.path, () => {});
    }

    await cat.save();
    res.status(200).json({
      success: true,
      message: isMaster ? 'Imágenes generadas (3 tamaños)' : 'Imagen actualizada',
      data: {
        image: cat.image,
        bannerImage: cat.bannerImage,
        bannerImageMobile: cat.bannerImageMobile,
      },
    });
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

// ============================ Banner ============================

export const uploadBannerImage = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const banner = await Banner.findById(req.params.id);
    if (!banner) throw new AppError(404, 'Banner no encontrado');
    const file = req.file;
    if (!file) throw new AppError(400, 'Sin imagen');

    // Variant: 'mobile' actualiza imageMobile, default actualiza image
    const variant = (req.query.variant as string) || 'main';
    const fieldKey = variant === 'mobile' ? 'imageMobile' : 'image';
    const oldUrl = (banner as any)[fieldKey] as string | undefined;
    if (oldUrl) {
      try { await imageService.deleteImage(oldUrl); } catch {}
    }
    const [url] = await uploadFiles([file], 'banners');
    if (!url) throw new AppError(500, 'Error al subir imagen');
    (banner as any)[fieldKey] = url;
    await banner.save();
    res.status(200).json({ success: true, message: 'Imagen actualizada', data: { [fieldKey]: url } });
  }
);
