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
 * Aplica descuentos en orden de prioridad:
 * 1. Variant Fixed Discount
 * 2. Variant Tiered Discount (sobre precio con descuento fijo)
 * 3. Parent Tiered Discount (legacy, solo si no hay otros descuentos)
 *
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

    // Obtener la variante con populate de parentProduct
    const variant = await ProductVariant.findById(variantId).populate('parentProduct');
    if (!variant) {
      throw new Error('Variante no encontrada');
    }

    const originalPrice = variant.price;
    let currentPrice = variant.price;
    let totalDiscountPerUnit = 0;
    let appliedTier = null;

    // =========================================================================
    // PRIORITY 1: Variant Fixed Discount
    // =========================================================================
    if (variant.fixedDiscount?.enabled) {
      const now = new Date();
      let isValidDate = true;

      if (variant.fixedDiscount.startDate && new Date(variant.fixedDiscount.startDate) > now) {
        isValidDate = false;
      }
      if (variant.fixedDiscount.endDate && new Date(variant.fixedDiscount.endDate) < now) {
        isValidDate = false;
      }

      if (isValidDate) {
        let fixedDiscount = 0;

        if (variant.fixedDiscount.type === 'percentage') {
          fixedDiscount = (currentPrice * variant.fixedDiscount.value) / 100;
        } else {
          fixedDiscount = variant.fixedDiscount.value;
        }

        totalDiscountPerUnit += fixedDiscount;
        currentPrice -= fixedDiscount;
      }
    }

    // =========================================================================
    // PRIORITY 2: Variant Tiered Discount (on discounted price)
    // =========================================================================
    if (variant.tieredDiscount?.active && variant.tieredDiscount.tiers.length > 0) {
      const now = new Date();
      let isValidDate = true;

      if (variant.tieredDiscount.startDate && new Date(variant.tieredDiscount.startDate) > now) {
        isValidDate = false;
      }
      if (variant.tieredDiscount.endDate && new Date(variant.tieredDiscount.endDate) < now) {
        isValidDate = false;
      }

      if (isValidDate) {
        // Ordenar tiers por minQuantity descendente
        const sortedTiers = [...variant.tieredDiscount.tiers].sort(
          (a, b) => b.minQuantity - a.minQuantity
        );

        // Buscar el tier más alto que aplique
        for (const tier of sortedTiers) {
          if (quantity >= tier.minQuantity) {
            // Verificar maxQuantity si existe
            if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
              let tierDiscount = 0;

              if (tier.type === 'percentage') {
                tierDiscount = (currentPrice * tier.value) / 100;
              } else {
                tierDiscount = tier.value;
              }

              totalDiscountPerUnit += tierDiscount;
              currentPrice -= tierDiscount;

              appliedTier = {
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                type: tier.type,
                value: tier.value,
              };

              break;
            }
          }
        }
      }
    }

    // =========================================================================
    // PRIORITY 3: Parent Tiered Discount (legacy - only if no other discounts)
    // =========================================================================
    if (totalDiscountPerUnit === 0 && variant.parentProduct) {
      const parent = variant.parentProduct as any;

      if (parent.tieredDiscounts && parent.tieredDiscounts.length > 0) {
        for (const tieredDiscount of parent.tieredDiscounts) {
          if (!tieredDiscount.active) continue;

          const now = new Date();
          let isValidDate = true;

          if (tieredDiscount.startDate && new Date(tieredDiscount.startDate) > now) {
            isValidDate = false;
          }
          if (tieredDiscount.endDate && new Date(tieredDiscount.endDate) < now) {
            isValidDate = false;
          }

          if (!isValidDate) continue;

          // Para productos SIN variants (attribute = null)
          if (!tieredDiscount.attribute || !tieredDiscount.attributeValue) {
            const tier = await getApplicableTierFromDiscount(tieredDiscount, quantity);

            if (tier) {
              let tierDiscount = 0;

              if (tier.type === 'percentage') {
                tierDiscount = (originalPrice * tier.value) / 100;
              } else {
                tierDiscount = tier.value;
              }

              totalDiscountPerUnit = tierDiscount;
              currentPrice = originalPrice - tierDiscount;

              appliedTier = {
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                type: tier.type,
                value: tier.value,
              };

              break;
            }
          }

          // Para productos CON variants - verificar si el variant coincide con el atributo
          const attributesMap = variant.attributes as any;
          const variantAttrValue =
            attributesMap instanceof Map
              ? attributesMap.get(tieredDiscount.attribute)
              : variant.attributes[tieredDiscount.attribute];

          if (variantAttrValue === tieredDiscount.attributeValue) {
            const tier = await getApplicableTierFromDiscount(tieredDiscount, quantity);

            if (tier) {
              let tierDiscount = 0;

              if (tier.type === 'percentage') {
                tierDiscount = (originalPrice * tier.value) / 100;
              } else {
                tierDiscount = tier.value;
              }

              totalDiscountPerUnit = tierDiscount;
              currentPrice = originalPrice - tierDiscount;

              appliedTier = {
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                type: tier.type,
                value: tier.value,
              };

              break;
            }
          }
        }
      }
    }

    // =========================================================================
    // FINAL CALCULATIONS
    // =========================================================================
    const finalPricePerUnit = Math.max(0, currentPrice);
    const totalDiscount = totalDiscountPerUnit * quantity;

    return {
      originalPrice,
      finalPricePerUnit: Math.round(finalPricePerUnit),
      totalDiscount: Math.round(totalDiscount),
      appliedTier,
    };
  } catch (error) {
    console.error('Error en calculatePriceByQuantity:', error);
    throw error;
  }
}

/**
 * Helper para encontrar el tier aplicable de un descuento dado
 */
function getApplicableTierFromDiscount(
  tieredDiscount: ITieredDiscount,
  quantity: number
): ITieredDiscount['tiers'][0] | null {
  const sortedTiers = [...tieredDiscount.tiers].sort((a, b) => b.minQuantity - a.minQuantity);

  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
        return tier;
      }
    }
  }

  return null;
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
