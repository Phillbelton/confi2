import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs/promises';
import { ENV } from '../config/env';
import logger from '../config/logger';
import { processImage, validateImageDimensions } from '../utils/imageProcessor';
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

      // Process image (optimize and resize)
      const processedPath = filePath.replace(
        path.extname(filePath),
        `-processed.${options.format || 'webp'}`
      );

      await processImage(filePath, processedPath, {
        width: options.width || 800,
        height: options.height || 800,
        quality: options.quality || 85,
        format: options.format || 'webp',
        fit: 'cover',
      });

      // Delete original, keep processed
      await deleteFile(filePath);

      // Get relative URL
      const filename = path.basename(processedPath);
      const imageUrl = getFileUrl(filename, options.folder);

      logger.info('✅ Image processed locally', {
        url: imageUrl,
        folder: options.folder,
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
      const filePath = path.join(ENV.UPLOAD_DIR, folder, filename);

      await deleteFile(filePath);

      logger.info('🗑️  Image deleted locally', { filePath });
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
  private static instance: IImageService;

  static getService(): IImageService {
    if (!this.instance) {
      const cloudinaryService = new CloudinaryImageService();

      if (cloudinaryService.isEnabled()) {
        this.instance = cloudinaryService;
        logger.info('🎨 Using Cloudinary for image storage');
      } else {
        this.instance = new LocalImageService();
        logger.info('💾 Using local storage for images');
      }
    }

    return this.instance;
  }
}

/**
 * Export singleton instance
 */
export const imageService = ImageServiceFactory.getService();
