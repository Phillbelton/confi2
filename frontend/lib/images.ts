/**
 * Image URL utilities
 * Converts relative backend URLs to absolute URLs for image rendering
 */

// Get the base URL for the backend (without /api)
const getBackendBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  // Remove the /api suffix to get the base URL
  return apiUrl.replace(/\/api$/, '');
};

/**
 * Converts a relative image URL from the backend to an absolute URL
 * @param imageUrl - The relative URL from the backend (e.g., "/uploads/products/image.webp")
 * @returns Absolute URL (e.g., "http://localhost:5000/uploads/products/image.webp")
 *
 * @example
 * getImageUrl("/uploads/products/image.webp")
 * // Returns: "http://localhost:5000/uploads/products/image.webp"
 */
export const getImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) {
    return ''; // Return empty string for null/undefined
  }

  // If already an absolute URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Convert relative URL to absolute
  const backendBaseUrl = getBackendBaseUrl();

  // Ensure the URL starts with /
  const normalizedUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${backendBaseUrl}${normalizedUrl}`;
};

/**
 * Converts an array of relative image URLs to absolute URLs
 * @param imageUrls - Array of relative URLs
 * @returns Array of absolute URLs
 */
export const getImageUrls = (imageUrls: string[] | undefined | null): string[] => {
  if (!imageUrls || !Array.isArray(imageUrls)) {
    return [];
  }

  return imageUrls.map(getImageUrl);
};

/**
 * Placeholder image URL for products without images
 */
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ESin imagen%3C/text%3E%3C/svg%3E';
