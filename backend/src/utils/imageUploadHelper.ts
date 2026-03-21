import { imageService } from '../services/imageService';
import logger from '../config/logger';

export interface ImageUploadResult {
  uploaded: string[];
  failed: Array<{ filename: string; error: string }>;
}

/**
 * Procesar múltiples archivos de imagen con enfoque híbrido (best effort)
 * Continúa procesando aunque algunas imágenes fallen
 */
export async function uploadImagesHybrid(
  files: Express.Multer.File[],
  options: {
    folder: string;
    width?: number;
    height?: number;
    quality?: number;
    maxImages?: number;
  }
): Promise<ImageUploadResult> {
  const result: ImageUploadResult = {
    uploaded: [],
    failed: [],
  };

  if (!files || files.length === 0) {
    return result;
  }

  // Validar límite máximo
  const filesToProcess = options.maxImages
    ? files.slice(0, options.maxImages)
    : files;

  // Procesar cada imagen individualmente
  for (const file of filesToProcess) {
    try {
      const uploadResult = await imageService.uploadImage(file.path, {
        folder: options.folder,
        width: options.width || 800,
        height: options.height || 800,
        quality: options.quality || 85,
        format: 'webp',
        validateDimensions: {
          minWidth: 200,
          minHeight: 200,
          maxWidth: 2000,
          maxHeight: 2000,
        },
      });

      result.uploaded.push(uploadResult.url);
    } catch (error: any) {
      logger.error('Error procesando imagen individual', {
        filename: file.originalname,
        error: error.message,
      });

      result.failed.push({
        filename: file.originalname,
        error: error.message || 'Error desconocido',
      });
    }
  }

  return result;
}
