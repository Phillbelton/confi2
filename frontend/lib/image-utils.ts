import { getImageUrl } from './images';

/**
 * Optimiza URLs de Cloudinary con transformaciones automáticas
 * Reduce tamaño de imagen en ~90% sin pérdida perceptible de calidad
 *
 * @param url - URL de la imagen (Cloudinary o cualquier otra)
 * @param width - Ancho deseado en píxeles (default: 400)
 * @param height - Alto deseado en píxeles (default: igual que width)
 * @param quality - Calidad de compresión auto, best, good, eco, low (default: 'auto')
 * @returns URL optimizada con transformaciones Cloudinary
 */
export function getOptimizedImageUrl(
  url: string,
  width: number = 400,
  height?: number,
  quality: 'auto' | 'best' | 'good' | 'eco' | 'low' = 'auto'
): string {
  if (!url || url.startsWith('/placeholder')) return url;

  // Solo optimizar imágenes de Cloudinary
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    const h = height || width;

    // Construir transformaciones Cloudinary
    // w_ = width, h_ = height, c_fill = crop/fill mode
    // q_auto = calidad automática, f_auto = formato automático (WebP, AVIF)
    // dpr_auto = device pixel ratio automático
    const transforms = `w_${width},h_${h},c_fill,q_${quality},f_auto,dpr_auto`;

    // Insertar transformaciones después de /upload/
    return url.replace('/upload/', `/upload/${transforms}/`);
  }

  return url;
}

/**
 * Valida y limpia URLs de imágenes para Next.js Image
 * Filtra URLs externas no configuradas en next.config
 *
 * IMPORTANTE: Esta función ahora aplica optimizaciones de Cloudinary automáticamente
 */
export function getSafeImageUrl(
  url: string | undefined | null,
  options?: { width?: number; height?: number; quality?: 'auto' | 'best' | 'good' | 'eco' | 'low' }
): string {
  if (!url) return '/placeholder-product.svg';

  // Convert relative URL to absolute backend URL
  const absoluteUrl = getImageUrl(url);

  if (!absoluteUrl) return '/placeholder-product.svg';

  // If it's a placeholder SVG, return as-is
  if (absoluteUrl.startsWith('/placeholder')) return absoluteUrl;

  // Lista de dominios permitidos (configurados en next.config.ts)
  const allowedDomains = [
    'cloudinary.com',
    'amazonaws.com',
    'localhost',
    '127.0.0.1',
    '192.168.5.2', // Local network IP
  ];

  try {
    const urlObj = new URL(absoluteUrl);
    const isAllowed = allowedDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    if (!isAllowed) return '/placeholder-product.svg';

    // ✅ OPTIMIZACIÓN: Aplicar transformaciones de Cloudinary
    if (options?.width || options?.height) {
      return getOptimizedImageUrl(
        absoluteUrl,
        options.width || 400,
        options.height,
        options.quality || 'auto'
      );
    }

    return absoluteUrl;
  } catch {
    // Si no es una URL válida, usar placeholder
    return '/placeholder-product.svg';
  }
}

/**
 * Obtiene la primera imagen válida de un array
 */
export function getFirstValidImage(images: (string | undefined | null)[]): string {
  for (const img of images) {
    if (img) {
      const safeUrl = getSafeImageUrl(img);
      if (safeUrl !== '/placeholder-product.svg') {
        return safeUrl;
      }
    }
  }
  return '/placeholder-product.svg';
}
