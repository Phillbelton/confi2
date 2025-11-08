import mongoose from 'mongoose';
import ProductParent, { ITieredDiscount } from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';

/**
 * Service para calcular y gestionar descuentos escalonados
 */

interface TierPreview {
  minQuantity: number;
  pricePerUnit: number;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  badge?: string;
}

interface DiscountResult {
  originalPrice: number;
  finalPricePerUnit: number;
  totalDiscount: number;
  appliedTier: {
    minQuantity: number;
    maxQuantity: number | null;
    type: 'percentage' | 'amount';
    value: number;
  } | null;
}

/**
 * Obtiene los 2 primeros tiers activos para mostrar en ProductCard
 * @param variantId ID de la variante
 * @returns Array con máximo 2 tier previews
 */
export async function getVisibleTierPreviews(
  variantId: mongoose.Types.ObjectId | string
): Promise<TierPreview[]> {
  try {
    // Obtener la variante
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variante no encontrada');
    }

    // Obtener el producto padre
    const parent = await ProductParent.findById(variant.parentProduct);
    if (!parent) {
      throw new Error('Producto padre no encontrado');
    }

    // Buscar descuentos escalonados que apliquen a esta variante
    const applicableDiscounts = parent.tieredDiscounts.filter((discount) => {
      // Verificar que el descuento esté activo
      if (!discount.active) return false;

      // Verificar fechas si existen
      const now = new Date();
      if (discount.startDate && discount.startDate > now) return false;
      if (discount.endDate && discount.endDate < now) return false;

      // Verificar que el atributo y valor coincidan con la variante
      const attributesMap = variant.attributes as any;
      const variantAttrValue = attributesMap instanceof Map
        ? attributesMap.get(discount.attribute)
        : variant.attributes[discount.attribute];
      return variantAttrValue === discount.attributeValue;
    });

    if (applicableDiscounts.length === 0) {
      return [];
    }

    // Tomar el primer descuento aplicable (asumimos que solo hay uno por variante)
    const discount = applicableDiscounts[0];

    // Ordenar los tiers por minQuantity y tomar los 2 primeros
    const sortedTiers = [...discount.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    const firstTwoTiers = sortedTiers.slice(0, 2);

    // Construir los previews
    const previews: TierPreview[] = firstTwoTiers.map((tier) => {
      let pricePerUnit = variant.price;

      if (tier.type === 'percentage') {
        pricePerUnit = variant.price * (1 - tier.value / 100);
      } else {
        pricePerUnit = variant.price - tier.value;
      }

      return {
        minQuantity: tier.minQuantity,
        pricePerUnit: Math.round(pricePerUnit),
        discountType: tier.type,
        discountValue: tier.value,
        badge: discount.badge,
      };
    });

    return previews;
  } catch (error) {
    console.error('Error en getVisibleTierPreviews:', error);
    throw error;
  }
}

/**
 * Calcula el precio unitario basado en la cantidad
 * @param variantId ID de la variante
 * @param quantity Cantidad solicitada
 * @returns Resultado del cálculo con descuento aplicado
 */
export async function calculatePriceByQuantity(
  variantId: mongoose.Types.ObjectId | string,
  quantity: number
): Promise<DiscountResult> {
  try {
    if (quantity < 1) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    // Obtener la variante
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variante no encontrada');
    }

    // Obtener el tier aplicable
    const tier = await getApplicableTier(variantId, quantity);

    // Si no hay tier aplicable, retornar precio normal
    if (!tier) {
      return {
        originalPrice: variant.price,
        finalPricePerUnit: variant.price,
        totalDiscount: 0,
        appliedTier: null,
      };
    }

    // Calcular el precio con descuento
    let finalPricePerUnit = variant.price;

    if (tier.type === 'percentage') {
      finalPricePerUnit = variant.price * (1 - tier.value / 100);
    } else {
      finalPricePerUnit = variant.price - tier.value;
    }

    // Asegurar que el precio no sea negativo
    finalPricePerUnit = Math.max(0, finalPricePerUnit);

    const totalDiscount = (variant.price - finalPricePerUnit) * quantity;

    return {
      originalPrice: variant.price,
      finalPricePerUnit: Math.round(finalPricePerUnit),
      totalDiscount: Math.round(totalDiscount),
      appliedTier: tier,
    };
  } catch (error) {
    console.error('Error en calculatePriceByQuantity:', error);
    throw error;
  }
}

/**
 * Obtiene el tier aplicable para una variante y cantidad dada
 * @param variantId ID de la variante
 * @param quantity Cantidad solicitada
 * @returns Tier aplicable o null si no hay descuento
 */
export async function getApplicableTier(
  variantId: mongoose.Types.ObjectId | string,
  quantity: number
): Promise<ITieredDiscount['tiers'][0] | null> {
  try {
    // Obtener la variante
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variante no encontrada');
    }

    // Obtener el producto padre
    const parent = await ProductParent.findById(variant.parentProduct);
    if (!parent) {
      throw new Error('Producto padre no encontrado');
    }

    // Buscar descuentos escalonados que apliquen a esta variante
    const applicableDiscounts = parent.tieredDiscounts.filter((discount) => {
      // Verificar que el descuento esté activo
      if (!discount.active) return false;

      // Verificar fechas si existen
      const now = new Date();
      if (discount.startDate && discount.startDate > now) return false;
      if (discount.endDate && discount.endDate < now) return false;

      // Verificar que el atributo y valor coincidan con la variante
      const attributesMap = variant.attributes as any;
      const variantAttrValue = attributesMap instanceof Map
        ? attributesMap.get(discount.attribute)
        : variant.attributes[discount.attribute];
      return variantAttrValue === discount.attributeValue;
    });

    if (applicableDiscounts.length === 0) {
      return null;
    }

    // Tomar el primer descuento aplicable
    const discount = applicableDiscounts[0];

    // Ordenar los tiers por minQuantity descendente
    const sortedTiers = [...discount.tiers].sort((a, b) => b.minQuantity - a.minQuantity);

    // Buscar el tier más alto que aplique para la cantidad dada
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity) {
        // Si el tier tiene maxQuantity, verificar que la cantidad no lo exceda
        if (tier.maxQuantity !== null && quantity > tier.maxQuantity) {
          continue;
        }
        return tier;
      }
    }

    return null;
  } catch (error) {
    console.error('Error en getApplicableTier:', error);
    throw error;
  }
}

/**
 * Aplica descuentos a todos los items del carrito
 * @param cartItems Array de items del carrito con variantId y quantity
 * @returns Array con los items actualizados con descuentos aplicados
 */
export async function applyDiscountToCart(
  cartItems: Array<{
    variantId: mongoose.Types.ObjectId | string;
    quantity: number;
  }>
): Promise<
  Array<{
    variantId: mongoose.Types.ObjectId | string;
    quantity: number;
    originalPrice: number;
    finalPricePerUnit: number;
    totalDiscount: number;
    subtotal: number;
  }>
> {
  try {
    const results = await Promise.all(
      cartItems.map(async (item) => {
        const discountResult = await calculatePriceByQuantity(item.variantId, item.quantity);

        return {
          variantId: item.variantId,
          quantity: item.quantity,
          originalPrice: discountResult.originalPrice,
          finalPricePerUnit: discountResult.finalPricePerUnit,
          totalDiscount: discountResult.totalDiscount,
          subtotal: discountResult.finalPricePerUnit * item.quantity,
        };
      })
    );

    return results;
  } catch (error) {
    console.error('Error en applyDiscountToCart:', error);
    throw error;
  }
}

/**
 * Formatea badges de descuento para mostrar en UI
 * @param previews Array de tier previews
 * @returns Array de strings formateados
 */
export function formatDiscountBadges(previews: TierPreview[]): string[] {
  return previews.map((preview) => {
    const formattedPrice = preview.pricePerUnit.toLocaleString('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return `Desde ${preview.minQuantity} un ${formattedPrice} c/u`;
  });
}
