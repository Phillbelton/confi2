/**
 * Normaliza valores de atributos de variantes para mantener consistencia
 * Esta función replica la lógica del backend (backend/src/utils/normalizeVariantValue.ts)
 *
 * Ejemplos:
 *   "250ml" → "250 ml"
 *   "2Litros" → "2 L"
 *   "5Litrios" → "5 L"
 *   "2quilos" → "2 kg"
 *   "1 kilo" → "1 kg"
 */
export function normalizeVariantValue(input: string): string {
  if (!input || typeof input !== 'string') return input;

  let value = input.trim().toLowerCase();

  // Mapeo de unidades comunes a sus formas normalizadas
  const unitReplacements: Record<string, string> = {
    // Litros
    'litrios': 'L',
    'litrio': 'L',
    'litros': 'L',
    'litro': 'L',
    'lts': 'L',
    'lt': 'L',
    'l': 'L',

    // Mililitros
    'mililitros': 'ml',
    'mililitro': 'ml',
    'mls': 'ml',
    'ml': 'ml',

    // Gramos
    'gramos': 'g',
    'gramo': 'g',
    'grs': 'g',
    'gr': 'g',
    'g': 'g',

    // Kilogramos
    'quilos': 'kg',
    'quilo': 'kg',
    'kilos': 'kg',
    'kilo': 'kg',
    'kilogramos': 'kg',
    'kilogramo': 'kg',
    'kgs': 'kg',
    'kg': 'kg',

    // Unidades
    'unidades': 'un',
    'unidad': 'un',
    'un': 'un',
    'u': 'un',

    // Metros
    'metros': 'm',
    'metro': 'm',
    'mts': 'm',
    'm': 'm',

    // Centímetros
    'centimetros': 'cm',
    'centimetro': 'cm',
    'cms': 'cm',
    'cm': 'cm',
  };

  // Intentar extraer número + unidad
  // Patrones soportados: "250l", "250 l", "250 litros", etc.
  const match = value.match(/^(\d+(?:[.,]\d+)?)\s*([a-zñáéíóú]+)$/i);

  if (match) {
    const [, number, unit] = match;
    const normalizedNumber = number.replace(',', '.'); // Normalizar decimales
    const normalizedUnit = unitReplacements[unit.toLowerCase()] || unit;

    // Formato: número + espacio + unidad normalizada
    return `${normalizedNumber} ${normalizedUnit}`;
  }

  // Si no coincide con el patrón número+unidad, intentar solo normalizar unidad
  const unitMatch = value.match(/^([a-zñáéíóú\s]+)$/i);
  if (unitMatch) {
    const unit = unitMatch[1].trim();
    const normalized = unitReplacements[unit.toLowerCase()];
    if (normalized) {
      return normalized;
    }
  }

  // Si no se puede normalizar, devolver el valor original con capitalización mejorada
  return input.trim();
}
