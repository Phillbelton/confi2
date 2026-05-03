import type { Product, ProductTier } from '@/types';

/**
 * Calcula el precio efectivo por unidad para una cantidad dada según tiers.
 * El tier con mayor minQuantity ≤ quantity gana.
 */
export function effectiveUnitPrice(product: Product, quantity: number): number {
  if (!product) return 0;
  const tiers = product.tiers || [];
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const t of sorted) if (quantity >= t.minQuantity) return t.pricePerUnit;
  return product.unitPrice ?? 0;
}

/**
 * Información de precio para una cantidad: precio efectivo, original, descuento.
 */
export function calculatePriceInfo(product: Product, quantity: number) {
  const ppu = effectiveUnitPrice(product, quantity);
  const finalPrice = ppu * quantity;
  const originalPrice = product.unitPrice * quantity;
  const discount = Math.max(0, originalPrice - finalPrice);
  const discountPercent = product.unitPrice > 0
    ? Math.round((1 - ppu / product.unitPrice) * 100)
    : 0;
  return { pricePerUnit: ppu, finalPrice, originalPrice, discount, discountPercent };
}

/**
 * ¿Tiene algún tipo de descuento (tiers o fixed)?
 */
export function hasAnyDiscount(product: Product): boolean {
  return (product.tiers && product.tiers.length > 0) || !!product.fixedDiscount?.enabled;
}

/**
 * Devuelve los tiers ordenados por minQuantity asc para mostrar como tabla.
 */
export function getDisplayTiers(product: Product): ProductTier[] {
  return [...(product.tiers || [])].sort((a, b) => a.minQuantity - b.minQuantity);
}

/**
 * Mejor descuento (mayor %) para mostrar en card como badge.
 */
export function getBestDiscountPercent(product: Product): number {
  const tiers = product.tiers || [];
  if (tiers.length === 0) return 0;
  const cheapest = Math.min(...tiers.map((t) => t.pricePerUnit));
  if (product.unitPrice <= 0) return 0;
  return Math.round((1 - cheapest / product.unitPrice) * 100);
}

/**
 * Step de cantidad para el input del carrito según saleUnit.
 * - unidad / cantidadMinima: step = 1
 * - display / embalaje: step = quantity (compra solo en múltiplos)
 */
export function quantityStep(product: Product): number {
  return product.saleUnit.type === 'display' || product.saleUnit.type === 'embalaje'
    ? product.saleUnit.quantity
    : 1;
}

/**
 * Mínimo del input para cantidad.
 * - unidad: 1
 * - cantidadMinima/display/embalaje: saleUnit.quantity
 */
export function minQuantity(product: Product): number {
  return product.saleUnit.type === 'unidad' ? 1 : product.saleUnit.quantity;
}
