import type { Product, ProductTier } from '@/types';

/**
 * SEMÁNTICA DE PRECIOS (refactor 2026-05-14):
 *
 * - `unitPrice` = precio de UNA presentación de venta (lo que el cliente
 *   añade al carrito con 1 click). Para display=24 es el precio de la bolsa
 *   completa, NO el precio por galleta individual.
 *
 * - `tier.minQuantity` = cantidad de PRESENTACIONES para activar el tier
 *   (ej. 2 = "2+ displays"). NO en unidades atómicas.
 *
 * - `tier.pricePerUnit` = precio de UNA presentación al alcanzar el tier.
 *
 * - `quantity` en cart/orden = cantidad de PRESENTACIONES (3 displays).
 *
 * - `saleUnit.quantity` sigue significando "unidades atómicas contenidas"
 *   solo para display/embalaje (informativo). Para cantidad_minima es
 *   "mínimo de presentaciones a comprar" (típicamente 5+).
 */

/**
 * Precio efectivo por presentación dada una cantidad de presentaciones.
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
 * Todos los valores son por presentación (no por unidad atómica).
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

export function hasAnyDiscount(product: Product): boolean {
  return (product.tiers && product.tiers.length > 0) || hasActiveFixedDiscount(product);
}

export function getDisplayTiers(product: Product): ProductTier[] {
  return [...(product.tiers || [])].sort((a, b) => a.minQuantity - b.minQuantity);
}

export function getBestDiscountPercent(product: Product): number {
  const tiers = product.tiers || [];
  if (tiers.length === 0) return 0;
  const cheapest = Math.min(...tiers.map((t) => t.pricePerUnit));
  if (product.unitPrice <= 0) return 0;
  return Math.round((1 - cheapest / product.unitPrice) * 100);
}

/**
 * ¿Tiene oferta fija activa (descuento puntual sobre el producto)?
 * NO incluye tiers de descuento por volumen — esos son precios mayoristas,
 * no "ofertas". Valida rango de fechas si está definido.
 */
export function hasActiveFixedDiscount(product: Product): boolean {
  const fd = product.fixedDiscount;
  if (!fd?.enabled) return false;
  const now = Date.now();
  const start = fd.startDate ? new Date(fd.startDate).getTime() : null;
  const end = fd.endDate ? new Date(fd.endDate).getTime() : null;
  if (start !== null && now < start) return false;
  if (end !== null && now > end) return false;
  return true;
}

/**
 * Porcentaje del descuento fijo (no por volumen). Si type='amount',
 * calcula el % equivalente sobre unitPrice.
 */
export function getFixedDiscountPercent(product: Product): number {
  if (!hasActiveFixedDiscount(product)) return 0;
  const fd = product.fixedDiscount!;
  if (fd.type === 'percentage') return Math.round(fd.value);
  // amount → % equivalente
  if (product.unitPrice <= 0) return 0;
  return Math.round((fd.value / product.unitPrice) * 100);
}

/**
 * Texto del badge de oferta. Si el admin definió un texto custom, lo usa.
 * Si no, devuelve `{X}% OFF` para percentage o `-${V}` para amount.
 */
export function getFixedDiscountBadge(product: Product): string {
  if (!hasActiveFixedDiscount(product)) return '';
  const fd = product.fixedDiscount!;
  if (fd.badge) return fd.badge;
  if (fd.type === 'percentage') return `${Math.round(fd.value)}% OFF`;
  return `-$${Math.round(fd.value).toLocaleString('es-CL')}`;
}

/**
 * Step de cantidad: siempre 1 presentación.
 * (Ej. cliente añade 1 display por click, sin importar que tenga 13 galletas.)
 */
export function quantityStep(_product: Product): number {
  return 1;
}

/**
 * Mínimo de presentaciones que el cliente debe agregar al carrito:
 * - cantidadMinima: saleUnit.quantity (ej. mín 5 unidades)
 * - resto: 1
 */
export function minQuantity(product: Product): number {
  return product.saleUnit.type === 'cantidadMinima'
    ? product.saleUnit.quantity
    : 1;
}

/**
 * ¿Es una presentación tipo paquete? Útil para mostrar badge "Bolsa × N",
 * la nota "$X/u atómica" y para textos descriptivos en el UI.
 * El precio ya viene per-presentación (no requiere multiplicación adicional).
 */
export function isPackagedSale(product: Product): boolean {
  const t = product.saleUnit?.type;
  return t === 'display' || t === 'embalaje';
}

/**
 * Identidad — el precio mostrado en la card YA es per presentación.
 * Se mantiene esta función para no romper callsites, pero ya no multiplica.
 */
export function presentationPrice(_product: Product, ppu: number): number {
  return ppu;
}

/**
 * Precio por UNIDAD ATÓMICA (galleta individual, etc.) derivado del ppu de la
 * presentación. Útil solo para mostrar "$X/u" como info comparativa al cliente.
 * Solo aplica a display/embalaje con quantity > 1.
 */
export function pricePerAtomicUnit(product: Product, ppu: number): number {
  if (!isPackagedSale(product)) return ppu;
  const qty = product.saleUnit?.quantity || 1;
  return qty > 0 ? ppu / qty : ppu;
}

/**
 * Sufijo a mostrar junto al precio. Distingue venta unitaria de paquete.
 */
export function presentationPriceSuffix(product: Product): string {
  const t = product.saleUnit?.type;
  const qty = product.saleUnit?.quantity || 1;
  if (t === 'display') return `display ${qty} u.`;
  if (t === 'embalaje') return `embalaje ${qty} u.`;
  return 'por unidad';
}
