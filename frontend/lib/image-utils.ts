/**
 * Valida y limpia URLs de imágenes para Next.js Image
 * Filtra URLs externas no configuradas en next.config
 */
export function getSafeImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholder-product.svg';

  // Si es una ruta local, usarla directamente
  if (url.startsWith('/')) return url;

  // Lista de dominios permitidos (configurados en next.config.ts)
  const allowedDomains = [
    'cloudinary.com',
    'amazonaws.com',
    'localhost',
    '127.0.0.1',
  ];

  try {
    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );
    return isAllowed ? url : '/placeholder-product.svg';
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
