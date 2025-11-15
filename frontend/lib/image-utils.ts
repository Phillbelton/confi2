import { getImageUrl } from './images';

/**
 * Valida y limpia URLs de imágenes para Next.js Image
 * Filtra URLs externas no configuradas en next.config
 */
export function getSafeImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholder-product.svg';

  // Convert relative URL to absolute backend URL
  const absoluteUrl = getImageUrl(url);

  if (!absoluteUrl) return '/placeholder-product.svg';

  // If it's a local path (placeholder), return as-is
  if (absoluteUrl.startsWith('/')) return absoluteUrl;

  // Lista de dominios permitidos (configurados en next.config.ts)
  const allowedDomains = [
    'cloudinary.com',
    'amazonaws.com',
    'localhost',
    '127.0.0.1',
  ];

  try {
    const urlObj = new URL(absoluteUrl);
    const isAllowed = allowedDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );
    return isAllowed ? absoluteUrl : '/placeholder-product.svg';
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
