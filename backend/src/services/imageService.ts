import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs/promises';
import { ENV } from '../config/env';
import logger from '../config/logger';
import { processImage, processImageMultiSize, validateImageDimensions } from '../utils/imageProcessor';
import { getFileUrl, deleteFile } from '../middleware/upload';

/**
 * Image Service - Abstraction Layer
 *
 * This service provides a unified interface for image storage,
 * supporting both local storage and Cloudinary CDN.
 *
 * Easy migration: Change implementation without touching business logic.
 */

export interface ImageUploadOptions {
  folder: string; // e.g., 'products', 'categories', 'brands'
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  /** Si está presente, LocalImageService genera múltiples variantes para `<img srcset>`. */
  responsiveWidths?: number[];
  validateDimensions?: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  };
}

export interface ImageUploadResult {
  url: string; // Full URL or relative path
  publicId?: string; // For Cloudinary (needed for deletion)
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Image Service Interface
 * Implement this interface to support different storage providers
 */
interface IImageService {
  uploadImage(filePath: string, options: ImageUploadOptions): Promise<ImageUploadResult>;
  deleteImage(imageUrl: string): Promise<void>;
  isEnabled(): boolean;
}

/**
 * Cloudinary Implementation
 */
class CloudinaryImageService implements IImageService {
  constructor() {
    if (this.isEnabled()) {
      cloudinary.config({
        cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
        api_key: ENV.CLOUDINARY_API_KEY,
        api_secret: ENV.CLOUDINARY_API_SECRET,
      });
      logger.info('☁️  Cloudinary configured successfully');
    }
  }

  isEnabled(): boolean {
    return (
      ENV.USE_CLOUDINARY &&
      !!ENV.CLOUDINARY_CLOUD_NAME &&
      !!ENV.CLOUDINARY_API_KEY &&
      !!ENV.CLOUDINARY_API_SECRET
    );
  }

  async uploadImage(filePath: string, options: ImageUploadOptions): Promise<ImageUploadResult> {
    try {
      // Validate dimensions if required
      if (options.validateDimensions) {
        const validation = await validateImageDimensions(
          filePath,
          options.validateDimensions.minWidth,
          options.validateDimensions.minHeight,
          options.validateDimensions.maxWidth,
          options.validateDimensions.maxHeight
        );

        if (!validation.valid) {
          throw new Error(validation.message);
        }
      }

      // Build transformation options
      const transformation: any[] = [];

      if (options.width || options.height) {
        transformation.push({
          width: options.width,
          height: options.height,
          crop: 'fill',
          gravity: 'auto',
        });
      }

      if (options.quality) {
        transformation.push({
          quality: options.quality,
        });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder,
        transformation: transformation.length > 0 ? transformation : undefined,
        format: options.format || 'webp',
        fetch_format: 'auto', // Auto-detect best format for the browser
        quality: 'auto:good', // Cloudinary's smart quality optimization
      });

      logger.info('✅ Image uploaded to Cloudinary', {
        publicId: result.public_id,
        url: result.secure_url,
        folder: options.folder,
      });

      // Delete local temporary file after successful upload
      try {
        await deleteFile(filePath);
        logger.info('🗑️  Temporary file deleted after Cloudinary upload', { filePath });
      } catch (deleteError: any) {
        logger.warn('⚠️  Failed to delete temporary file', {
          filePath,
          error: deleteError.message,
        });
        // Don't throw - upload was successful, deletion failure is not critical
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error: any) {
      logger.error('❌ Cloudinary upload failed', {
        error: error.message,
        filePath,
        folder: options.folder,
      });
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/cloud-name/image/upload/v123/folder/image.webp
      // public_id: folder/image
      const urlParts = imageUrl.split('/upload/');
      if (urlParts.length < 2) {
        throw new Error('Invalid Cloudinary URL');
      }

      const pathParts = urlParts[1].split('/');
      pathParts.shift(); // Remove version (v123...)
      const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension

      await cloudinary.uploader.destroy(publicId);

      logger.info('🗑️  Image deleted from Cloudinary', { publicId });
    } catch (error: any) {
      logger.error('❌ Cloudinary delete failed', {
        error: error.message,
        imageUrl,
      });
      // Don't throw - deletion failures shouldn't block the operation
    }
  }
}

/**
 * Local Storage Implementation (Fallback/Legacy)
 */
class LocalImageService implements IImageService {
  isEnabled(): boolean {
    return true; // Always available as fallback
  }

  async uploadImage(filePath: string, options: ImageUploadOptions): Promise<ImageUploadResult> {
    try {
      // Validate dimensions if required
      if (options.validateDimensions) {
        const validation = await validateImageDimensions(
          filePath,
          options.validateDimensions.minWidth,
          options.validateDimensions.minHeight,
          options.validateDimensions.maxWidth,
          options.validateDimensions.maxHeight
        );

        if (!validation.valid) {
          throw new Error(validation.message);
        }
      }

      // Asegurar que la carpeta destino exista (collections/, banners/, etc.)
      const targetDir = path.join(ENV.UPLOAD_DIR, options.folder);
      await fs.mkdir(targetDir, { recursive: true });

      const rawBasename = path.basename(filePath, path.extname(filePath));

      let storedFilename: string;

      if (options.responsiveWidths && options.responsiveWidths.length > 0) {
        // Modo multi-size: genera 3+ variantes -w400, -w800, -w1200 para `<img srcset>`.
        const result = await processImageMultiSize(
          filePath,
          targetDir,
          rawBasename,
          options.responsiveWidths,
          options.quality || 85
        );
        storedFilename = result.baseFilename;
      } else {
        // Modo single-size (legacy / fallback)
        const ext = options.format || 'webp';
        storedFilename = `${rawBasename}-processed.${ext}`;
        const processedPath = path.join(targetDir, storedFilename);
        await processImage(filePath, processedPath, {
          width: options.width || 1200,
          height: options.height || 1200,
          quality: options.quality || 85,
          format: options.format || 'webp',
          fit: 'inside',
        });
      }

      // Borrar el archivo original (estaba en temp/)
      await deleteFile(filePath);

      // URL relativa portable: /uploads/<folder>/<filename>
      const imageUrl = getFileUrl(storedFilename, options.folder);

      logger.info('✅ Image processed locally', {
        url: imageUrl,
        folder: options.folder,
        multiSize: !!options.responsiveWidths,
      });

      return {
        url: imageUrl,
      };
    } catch (error: any) {
      logger.error('❌ Local image processing failed', {
        error: error.message,
        filePath,
        folder: options.folder,
      });
      throw new Error(`Local image processing failed: ${error.message}`);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL (/uploads/products/image.webp)
      const filename = path.basename(imageUrl);
      const folder = imageUrl.split('/')[2]; // Extract folder from /uploads/folder/file
      const folderDir = path.join(ENV.UPLOAD_DIR, folder);

      // Si tiene suffix -w<N>, borrar TODAS las variantes hermanas
      // (`abc-w400.webp`, `abc-w800.webp`, `abc-w1200.webp`)
      const m = filename.match(/^(.+)-w\d+(\.[a-z]+)$/i);
      if (m) {
        const [, stem, ext] = m;
        const entries = await fs.readdir(folderDir).catch(() => []);
        const variantRegex = new RegExp(`^${stem}-w\\d+${ext.replace('.', '\\.')}$`, 'i');
        const toDelete = entries.filter((f) => variantRegex.test(f));
        for (const f of toDelete) {
          try {
            await deleteFile(path.join(folderDir, f));
          } catch {}
        }
        logger.info('🗑️  Image (multi-size) deleted locally', {
          folder,
          stem,
          deleted: toDelete.length,
        });
      } else {
        // Single-size legacy
        const filePath = path.join(folderDir, filename);
        await deleteFile(filePath);
        logger.info('🗑️  Image deleted locally', { filePath });
      }
    } catch (error: any) {
      logger.warn('⚠️  Local image delete failed', {
        error: error.message,
        imageUrl,
      });
      // Don't throw - deletion failures shouldn't block the operation
    }
  }
}

/**
 * Image Service Factory
 * Returns the appropriate service based on configuration
 */
class ImageServiceFactory {
  private static instance: IImageService | null = null;

  static getService(): IImageService {
    if (!this.instance) {
      try {
        const cloudinaryService = new CloudinaryImageService();

        if (cloudinaryService.isEnabled()) {
          this.instance = cloudinaryService;
          logger.info('🎨 Using Cloudinary for image storage');
        } else {
          this.instance = new LocalImageService();
          logger.info('💾 Using local storage for images');
        }
      } catch (error: any) {
        logger.error('❌ Failed to initialize image service, falling back to local storage', {
          error: error.message,
        });
        this.instance = new LocalImageService();
      }
    }

    return this.instance;
  }
}

/**
 * Export factory method instead of singleton instance
 * This allows lazy initialization and better error handling
 */
let cachedService: IImageService | null = null;

export const imageService = {
  uploadImage: async (filePath: string, options: ImageUploadOptions): Promise<ImageUploadResult> => {
    if (!cachedService) {
      cachedService = ImageServiceFactory.getService();
    }
    return cachedService.uploadImage(filePath, options);
  },
  deleteImage: async (imageUrl: string): Promise<void> => {
    if (!cachedService) {
      cachedService = ImageServiceFactory.getService();
    }
    return cachedService.deleteImage(imageUrl);
  },
  isEnabled: (): boolean => {
    if (!cachedService) {
      cachedService = ImageServiceFactory.getService();
    }
    return cachedService.isEnabled();
  },
};
