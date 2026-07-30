import type { Product, ProductTier, Presentation, FixedDiscount } from '@/types';

/**
 * Shape mínimo para calcular precio: lo cumplen tanto `Product` (vía la
 * presentación principal denormalizada en `unitPrice/tiers/fixedDiscount`) como
 * una `Presentation`. Permite reusar toda la matemática para ambos.
 */
export interface Priceable {
  unitPrice: number;
  tiers?: ProductTier[];
  fixedDiscount?: FixedDiscount;
}

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
 * Precio base por presentación tras aplicar la oferta fija vigente.
 *
 * `fixedDiscount` anuncia un cambio de precio real: el valor con descuento es
 * el nuevo precio efectivo para cantidades por debajo de cualquier tramo. Los
 * `tiers` (precio por volumen) aplican aparte. Mantener en sync con el backend
 * (`orderController.discountedUnitPrice` / `effectiveUnitPrice`).
 */
export function discountedUnitPrice(product: Priceable): number {
  const base = product?.unitPrice ?? 0;
  if (!hasActiveFixedDiscount(product)) return base;
  const fd = product.fixedDiscount!;
  const next = fd.type === 'percentage' ? base * (1 - fd.value / 100) : base - fd.value;
  // CLP no tiene decimales: redondeamos para que el precio cobrado coincida
  // exactamente con el mostrado.
  return Math.max(0, Math.round(next));
}

/**
 * Precio efectivo por presentación dada una cantidad de presentaciones.
 *
 *   1. Parte del precio base (`unitPrice` con la oferta fija ya aplicada).
 *   2. Si la cantidad alcanza un tramo, usa ese precio por volumen. Con oferta
 *      fija vigente que bajó el precio, nunca por encima del precio anunciado
 *      (`Math.min`); sin oferta, el tramo es autoritativo.
 */
export function effectiveUnitPrice(product: Priceable, quantity: number): number {
  if (!product) return 0;
  const base = discountedUnitPrice(product);
  const fixedLoweredPrice = base < (product.unitPrice ?? 0);
  const tiers = product.tiers || [];
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const t of sorted) {
    if (quantity >= t.minQuantity) {
      return fixedLoweredPrice ? Math.min(t.pricePerUnit, base) : t.pricePerUnit;
    }
  }
  return base;
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
export function hasActiveFixedDiscount(product: Priceable): boolean {
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

// ============================ Multi-presentación ============================

/** Presentación principal del producto (o la primera, o undefined). */
export function getPrincipal(product: Product): Presentation | undefined {
  const list = product.presentaciones ?? [];
  return list.find((p) => p.principal) ?? list[0];
}

/**
 * Orden en que se le muestran las presentaciones al cliente: de la más chica a
 * la más grande. Los subconjuntos salen solos (unidad+display, display+caja…),
 * lo que nunca puede pasar es leer "Display · Unidad · Embalaje".
 */
const PRES_TYPE_RANK: Record<Presentation['type'], number> = {
  unidad: 0,
  cantidadMinima: 1,
  display: 2,
  embalaje: 3,
};

/**
 * Presentaciones en orden canónico (unidad → display → embalaje).
 *
 * El array de la DB viene en el orden con que se cargó el producto, donde el
 * índice 0 es la presentación principal: un tercio del catálogo está guardado
 * como `display > unidad > embalaje` porque su principal es el display. Ese es
 * un dato de negocio válido, así que **no** se reordena la data: se ordena una
 * COPIA al renderizar. La presentación por defecto sigue saliendo de
 * `getPrincipal` (lee el flag `principal`, no la posición), así que el chip
 * preseleccionado no cambia — solo cambia cómo se leen de izquierda a derecha.
 */
export function orderedPresentations(product: Product): Presentation[] {
  const list = product.presentaciones ?? [];
  return [...list].sort((a, b) => {
    const byType = (PRES_TYPE_RANK[a.type] ?? 99) - (PRES_TYPE_RANK[b.type] ?? 99);
    // Dos del mismo tipo (ej. dos displays de distinto factor): la más chica
    // primero, para que la progresión de tamaño se mantenga.
    return byType !== 0 ? byType : (a.quantity ?? 0) - (b.quantity ?? 0);
  });
}

/**
 * Resuelve la presentación a usar para precios: la de `presentationId`, o la
 * principal, o —productos sin `presentaciones`— el propio producto, que es
 * `Priceable` por sus campos legacy denormalizados.
 */
export function getPresentation(product: Product, presentationId?: string): Priceable {
  const list = product.presentaciones ?? [];
  const found = presentationId ? list.find((p) => p._id === presentationId) : undefined;
  return found ?? getPrincipal(product) ?? product;
}

/** Precio "desde": el menor entre las presentaciones (para la card del catálogo). */
export function priceFrom(product: Product): number {
  const list = product.presentaciones ?? [];
  if (list.length === 0) return product.unitPrice;
  return Math.min(...list.map((p) => p.unitPrice));
}

/**
 * Etiqueta de una presentación para el cliente (incluye el factor).
 * Fuente única usada por la ficha, la card y la vista rápida.
 */
export function presLabel(p: Presentation): string {
  if (p.label) return p.label;
  if (p.type === 'unidad') return 'Por unidad';
  if (p.type === 'display') return `Display × ${p.quantity}`;
  if (p.type === 'embalaje') return `Embalaje × ${p.quantity}`;
  return `Mínimo ${p.quantity}`;
}

/** Etiqueta corta por tipo (sin factor) — para los chips-señal de la card. */
export function presTypeLabel(type: Presentation['type']): string {
  switch (type) {
    case 'unidad':
      return 'Unidad';
    case 'display':
      return 'Display';
    case 'embalaje':
      return 'Embalaje';
    default:
      return 'Mínimo';
  }
}

/**
 * Sustantivo de la unidad de venta para textos con cantidad ("3 displays",
 * "1 a 2 cajas").
 *
 * ⚠️ Los precios (base y tramos) son POR PRESENTACIÓN, no por unidad atómica:
 * decir "unidades" cuando la presentación es un display o una caja miente el
 * precio (un display de 12 a $23.074 no son $23.074 la galleta). Fuente única
 * de la ficha y de la card del catálogo.
 */
export function saleUnitNoun(product: Product, count = 1): string {
  const plural = count !== 1;
  switch (product.saleUnit?.type) {
    case 'display':
      return plural ? 'displays' : 'display';
    case 'embalaje':
      return plural ? 'cajas' : 'caja';
    default:
      // `cantidadMinima` también vende unidades atómicas (con mínimo).
      return plural ? 'unidades' : 'unidad';
  }
}

/** Sufijo del precio por presentación: "c/u", "c/display", "c/caja". */
export function pricePerSaleUnitSuffix(product: Product): string {
  switch (product.saleUnit?.type) {
    case 'display':
      return 'c/display';
    case 'embalaje':
      return 'c/caja';
    default:
      return 'c/u';
  }
}
