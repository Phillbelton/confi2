import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

export interface ImageProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Procesa una imagen: redimensiona, optimiza y convierte formato
 *
 * @param inputPath - Ruta del archivo original
 * @param outputPath - Ruta donde guardar el archivo procesado
 * @param options - Opciones de procesamiento
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
  options: ImageProcessOptions = {}
): Promise<void> {
  const {
    width = 800,
    height = 800,
    quality = 85,
    format = 'webp',
    fit = 'cover',
  } = options;

  try {
    let pipeline = sharp(inputPath).resize(width, height, {
      fit,
      withoutEnlargement: true, // No agrandar imágenes pequeñas
    });

    // Aplicar formato y calidad
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, progressive: true, compressionLevel: 9 });
        break;
      case 'webp':
      default:
        pipeline = pipeline.webp({ quality });
        break;
    }

    await pipeline.toFile(outputPath);

    logger.debug('Imagen procesada', { file: path.basename(outputPath) });
  } catch (error) {
    logger.error('Error procesando imagen', { error });
    throw new Error('Error al procesar la imagen');
  }
}

/**
 * Genera múltiples versiones por ancho (responsive `<img srcset>`).
 * Cada variante preserva aspect ratio (`fit:inside`) y NO agranda fuentes pequeñas.
 *
 * Naming: `<basename>-w<width>.webp` (ej. `abc-w400.webp`, `abc-w800.webp`, `abc-w1200.webp`).
 * El "default src" para `<img src>` es el ancho intermedio del array.
 *
 * @param inputPath  Ruta del archivo fuente (multer temp/...)
 * @param outputDir  Directorio donde escribir las variantes
 * @param baseName   Nombre base sin extensión ni suffix (ej. 'abc')
 * @param widths     Array de anchos en px. Default: [400, 800, 1200]
 * @returns          baseFilename (la variante intermedia, ej. 'abc-w800.webp') y todas las rutas
 */
export async function processImageMultiSize(
  inputPath: string,
  outputDir: string,
  baseName: string,
  widths: number[] = [400, 800, 1200],
  quality: number = 85
): Promise<{ baseFilename: string; paths: string[] }> {
  if (widths.length === 0) throw new Error('processImageMultiSize: widths vacío');
  const ext = '.webp';
  const paths: string[] = [];

  for (const w of widths) {
    const outPath = path.join(outputDir, `${baseName}-w${w}${ext}`);
    await sharp(inputPath)
      .resize(w, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toFile(outPath);
    paths.push(outPath);
  }

  // El src "default" es la variante intermedia (el browser hará selección real vía srcset)
  const defaultW = widths[Math.floor(widths.length / 2)];
  const baseFilename = `${baseName}-w${defaultW}${ext}`;

  logger.debug('Multi-size generado', { baseName, widths });
  return { baseFilename, paths };
}

/**
 * Genera múltiples versiones de una imagen (thumbnail, medium, large)
 *
 * @param inputPath - Ruta del archivo original
 * @param outputDir - Directorio donde guardar las versiones
 * @param baseName - Nombre base para los archivos de salida
 * @returns Objeto con las rutas de las versiones generadas
 */
export async function generateImageVariants(
  inputPath: string,
  outputDir: string,
  baseName: string
): Promise<{
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}> {
  const ext = '.webp'; // Usar WebP para mejor compresión

  const variants = {
    thumbnail: path.join(outputDir, `${baseName}-thumb${ext}`),
    medium: path.join(outputDir, `${baseName}-medium${ext}`),
    large: path.join(outputDir, `${baseName}-large${ext}`),
    original: inputPath,
  };

  try {
    // Generar thumbnail (200x200)
    await processImage(inputPath, variants.thumbnail, {
      width: 200,
      height: 200,
      quality: 80,
      format: 'webp',
      fit: 'cover',
    });

    // Generar versión media (600x600)
    await processImage(inputPath, variants.medium, {
      width: 600,
      height: 600,
      quality: 85,
      format: 'webp',
      fit: 'cover',
    });

    // Generar versión grande (1200x1200)
    await processImage(inputPath, variants.large, {
      width: 1200,
      height: 1200,
      quality: 90,
      format: 'webp',
      fit: 'cover',
    });

    logger.debug('Variantes generadas', { baseName });

    return variants;
  } catch (error) {
    logger.error('Error generando variantes', { error });
    throw new Error('Error al generar variantes de imagen');
  }
}

/**
 * Optimiza una imagen sin cambiar sus dimensiones
 *
 * @param inputPath - Ruta del archivo a optimizar
 * @param outputPath - Ruta del archivo optimizado (puede ser la misma)
 * @param quality - Calidad de compresión (0-100)
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  quality: number = 85
): Promise<void> {
  try {
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);

    logger.debug('Imagen optimizada', { file: path.basename(outputPath) });
  } catch (error) {
    logger.error('Error optimizando imagen', { error });
    throw new Error('Error al optimizar la imagen');
  }
}

/**
 * Obtiene metadata de una imagen
 *
 * @param imagePath - Ruta de la imagen
 * @returns Metadata de la imagen (width, height, format, size, etc.)
 */
export async function getImageMetadata(
  imagePath: string
): Promise<sharp.Metadata> {
  try {
    return await sharp(imagePath).metadata();
  } catch (error) {
    logger.error('Error obteniendo metadata', { error });
    throw new Error('Error al obtener metadata de la imagen');
  }
}

/**
 * Valida dimensiones de una imagen
 *
 * @param imagePath - Ruta de la imagen
 * @param minWidth - Ancho mínimo
 * @param minHeight - Alto mínimo
 * @param maxWidth - Ancho máximo
 * @param maxHeight - Alto máximo
 * @returns true si es válida, false en caso contrario
 */
export async function validateImageDimensions(
  imagePath: string,
  minWidth: number = 100,
  minHeight: number = 100,
  maxWidth: number = 4000,
  maxHeight: number = 4000
): Promise<{ valid: boolean; message?: string; metadata?: sharp.Metadata }> {
  try {
    const metadata = await getImageMetadata(imagePath);

    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        message: 'No se pudo determinar las dimensiones de la imagen',
      };
    }

    if (metadata.width < minWidth || metadata.height < minHeight) {
      return {
        valid: false,
        message: `La imagen es demasiado pequeña. Mínimo: ${minWidth}x${minHeight}px`,
        metadata,
      };
    }

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      return {
        valid: false,
        message: `La imagen es demasiado grande. Máximo: ${maxWidth}x${maxHeight}px`,
        metadata,
      };
    }

    return {
      valid: true,
      metadata,
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Error al validar dimensiones de la imagen',
    };
  }
}

/**
 * Elimina archivo y sus variantes
 *
 * @param basePath - Ruta base del archivo (sin sufijos -thumb, -medium, -large)
 */
export async function deleteImageVariants(basePath: string): Promise<void> {
  const dir = path.dirname(basePath);
  const nameWithoutExt = path.basename(basePath, path.extname(basePath));

  const variants = [
    basePath, // Original
    path.join(dir, `${nameWithoutExt}-thumb.webp`),
    path.join(dir, `${nameWithoutExt}-medium.webp`),
    path.join(dir, `${nameWithoutExt}-large.webp`),
  ];

  for (const variant of variants) {
    try {
      if (fs.existsSync(variant)) {
        await fs.promises.unlink(variant);
        logger.debug('Variante eliminada', { file: path.basename(variant) });
      }
    } catch (error) {
      logger.error('Error eliminando variante', { variant, error });
    }
  }
}
