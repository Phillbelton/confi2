import mongoose from 'mongoose';
import ProductParent from '../models/ProductParent';
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
 * Helper: Valida si un descuento está dentro del rango de fechas válido
 * @param startDate Fecha de inicio (opcional)
 * @param endDate Fecha de fin (opcional)
 * @returns true si el descuento está activo según las fechas
 */
function isDiscountDateValid(startDate?: Date, endDate?: Date): boolean {
  const now = new Date();
  if (startDate && new Date(startDate) > now) return false;
  if (endDate && new Date(endDate) < now) return false;
  return true;
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

    // Verificar si tiene tiered discount activo
    if (!variant.tieredDiscount?.active || !variant.tieredDiscount.tiers || variant.tieredDiscount.tiers.length === 0) {
      return [];
    }

    // Verificar fechas
    if (!isDiscountDateValid(variant.tieredDiscount.startDate, variant.tieredDiscount.endDate)) {
      return [];
    }

    // Calcular precio base (con fixed discount si existe)
    let basePrice = variant.price;
    if (variant.fixedDiscount?.enabled && isDiscountDateValid(variant.fixedDiscount.startDate, variant.fixedDiscount.endDate)) {
      if (variant.fixedDiscount.type === 'percentage') {
        basePrice -= (basePrice * variant.fixedDiscount.value) / 100;
      } else {
        basePrice -= variant.fixedDiscount.value;
      }
    }

    // Ordenar los tiers por minQuantity y tomar los 2 primeros
    const sortedTiers = [...variant.tieredDiscount.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    const firstTwoTiers = sortedTiers.slice(0, 2);

    // Construir los previews
    const previews: TierPreview[] = firstTwoTiers.map((tier) => {
      let pricePerUnit = basePrice;

      if (tier.type === 'percentage') {
        pricePerUnit = basePrice * (1 - tier.value / 100);
      } else {
        pricePerUnit = basePrice - tier.value;
      }

      return {
        minQuantity: tier.minQuantity,
        pricePerUnit: Math.round(Math.max(0, pricePerUnit)),
        discountType: tier.type,
        discountValue: tier.value,
        badge: variant.tieredDiscount?.badge,
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
 * 2. Variant Tiered Discount (acumulativo sobre precio con descuento fijo)
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
      if (isDiscountDateValid(variant.fixedDiscount.startDate, variant.fixedDiscount.endDate)) {
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
      if (isDiscountDateValid(variant.tieredDiscount.startDate, variant.tieredDiscount.endDate)) {
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
 * Aplica descuentos a todos los items del carrito
 * Optimizado para evitar queries N+1: carga todos los variants de una vez
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
    // Optimización: Cargar todos los variants de una vez (evita N+1 queries)
    const variantIds = cartItems.map((item) => item.variantId);
    const variants = await ProductVariant.find({ _id: { $in: variantIds } });

    // Crear un map para acceso rápido
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    // Calcular descuentos para cada item
    const results = cartItems.map((item) => {
      const variant = variantMap.get(item.variantId.toString());
      if (!variant) {
        throw new Error(`Variante ${item.variantId} no encontrada`);
      }

      const originalPrice = variant.price;
      let currentPrice = variant.price;
      let totalDiscountPerUnit = 0;

      // PRIORITY 1: Variant Fixed Discount
      if (variant.fixedDiscount?.enabled) {
        if (isDiscountDateValid(variant.fixedDiscount.startDate, variant.fixedDiscount.endDate)) {
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

      // PRIORITY 2: Variant Tiered Discount (on discounted price)
      if (variant.tieredDiscount?.active && variant.tieredDiscount.tiers && variant.tieredDiscount.tiers.length > 0) {
        if (isDiscountDateValid(variant.tieredDiscount.startDate, variant.tieredDiscount.endDate)) {
          // Ordenar tiers por minQuantity descendente
          const sortedTiers = [...variant.tieredDiscount.tiers].sort(
            (a, b) => b.minQuantity - a.minQuantity
          );

          // Buscar el tier más alto que aplique
          for (const tier of sortedTiers) {
            if (item.quantity >= tier.minQuantity) {
              // Verificar maxQuantity si existe
              if (tier.maxQuantity === null || item.quantity <= tier.maxQuantity) {
                let tierDiscount = 0;

                if (tier.type === 'percentage') {
                  tierDiscount = (currentPrice * tier.value) / 100;
                } else {
                  tierDiscount = tier.value;
                }

                totalDiscountPerUnit += tierDiscount;
                currentPrice -= tierDiscount;
                break;
              }
            }
          }
        }
      }

      const finalPricePerUnit = Math.max(0, currentPrice);
      const totalDiscount = totalDiscountPerUnit * item.quantity;

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        originalPrice,
        finalPricePerUnit: Math.round(finalPricePerUnit),
        totalDiscount: Math.round(totalDiscount),
        subtotal: Math.round(finalPricePerUnit) * item.quantity,
      };
    });

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
