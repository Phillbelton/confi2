/**
 * SKU Generator Utility
 * Genera SKUs descriptivos y legibles para productos y variantes
 */

/**
 * Palabras vacías a eliminar del SKU (stop words en español)
 */
const STOP_WORDS = [
  'con',
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'y',
  'en',
  'a',
  'para',
  'por',
  'sin',
  'sobre',
  'un',
  'una',
];

/**
 * Limpiar y normalizar texto para SKU
 */
function cleanText(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^A-Z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios → guiones
    .replace(/-+/g, '-') // Múltiples guiones → uno solo
    .replace(/^-|-$/g, ''); // Eliminar guiones al inicio/final
}

/**
 * Eliminar palabras vacías (stop words)
 */
function removeStopWords(text: string): string {
  const words = text.split('-');
  const filteredWords = words.filter(
    (word) => !STOP_WORDS.includes(word.toLowerCase())
  );
  return filteredWords.join('-');
}

/**
 * Truncar SKU a longitud máxima manteniendo palabras completas
 */
function truncateSKU(sku: string, maxLength: number): string {
  if (sku.length <= maxLength) {
    return sku;
  }

  // Intentar cortar en un guion para no romper palabras
  const truncated = sku.substring(0, maxLength);
  const lastDash = truncated.lastIndexOf('-');

  if (lastDash > maxLength * 0.7) {
    // Si el último guion está en los últimos 30%, cortar ahí
    return truncated.substring(0, lastDash);
  }

  // Si no, cortar directo
  return truncated;
}

/**
 * Generar SKU para producto simple (sin variantes)
 */
export function generateSimpleProductSKU(
  productName: string,
  maxLength: number = 50
): string {
  let sku = cleanText(productName);
  sku = removeStopWords(sku);
  sku = truncateSKU(sku, maxLength);
  return sku;
}

/**
 * Generar SKU para variante de producto
 */
export function generateVariantSKU(
  productName: string,
  attributes: Record<string, string>,
  maxLength: number = 50
): string {
  // Limpiar nombre del producto
  let baseSKU = cleanText(productName);
  baseSKU = removeStopWords(baseSKU);

  // Procesar atributos
  const attrParts: string[] = [];
  for (const [key, value] of Object.entries(attributes)) {
    const cleanValue = cleanText(value);
    if (cleanValue) {
      attrParts.push(cleanValue);
    }
  }

  // Combinar base + atributos
  let fullSKU = attrParts.length > 0
    ? `${baseSKU}-${attrParts.join('-')}`
    : baseSKU;

  // Truncar si excede el límite
  fullSKU = truncateSKU(fullSKU, maxLength);

  return fullSKU;
}

/**
 * Validar que un SKU sea válido
 */
export function validateSKU(sku: string): boolean {
  // SKU debe tener al menos 3 caracteres
  if (!sku || sku.length < 3) {
    return false;
  }

  // Solo mayúsculas, números y guiones
  const validPattern = /^[A-Z0-9-]+$/;
  if (!validPattern.test(sku)) {
    return false;
  }

  // No debe empezar o terminar con guion
  if (sku.startsWith('-') || sku.endsWith('-')) {
    return false;
  }

  // No debe tener guiones consecutivos
  if (sku.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Sanitizar SKU proporcionado por usuario
 */
export function sanitizeUserSKU(sku: string, maxLength: number = 50): string {
  let sanitized = cleanText(sku);
  sanitized = truncateSKU(sanitized, maxLength);
  return sanitized;
}
