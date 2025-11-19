/**
 * ============================================================================
 * DISCOUNT CALCULATOR - Unified Discount Logic
 * ============================================================================
 *
 * Single source of truth for discount calculations across the entire frontend.
 * Used by: ProductCard, CartStore, Checkout
 *
 * Priority Order:
 * 1. Variant Fixed Discount
 * 2. Variant Tiered Discount (applied on discounted price)
 * 3. Parent Tiered Discount (legacy, only if no other discounts)
 */

import type {
  ProductParent,
  ProductVariant,
  TieredDiscountTier,
  TieredDiscount,
} from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface DiscountResult {
  /** Original price per unit */
  originalPrice: number;
  /** Final price per unit after all discounts */
  finalPrice: number;
  /** Total discount amount per unit */
  discountPerUnit: number;
  /** Applied tier information (if any) */
  appliedTier: {
    minQuantity: number;
    maxQuantity: number | null;
    type: 'percentage' | 'amount';
    value: number;
    source: 'variant-tiered' | 'parent-tiered';
  } | null;
  /** Applied fixed discount (if any) */
  appliedFixedDiscount: {
    type: 'percentage' | 'amount';
    value: number;
  } | null;
}

export interface CartItemDiscount extends DiscountResult {
  /** Quantity being purchased */
  quantity: number;
  /** Subtotal for this item (finalPrice * quantity) */
  subtotal: number;
  /** Total discount for this item (discountPerUnit * quantity) */
  totalDiscount: number;
}

// ============================================================================
// DATE VALIDATION HELPERS
// ============================================================================

function isDateValid(startDate?: string, endDate?: string): boolean {
  const now = new Date();

  if (startDate && new Date(startDate) > now) {
    return false;
  }

  if (endDate && new Date(endDate) < now) {
    return false;
  }

  return true;
}

// ============================================================================
// TIER CALCULATION
// ============================================================================

/**
 * Find the applicable tier for a given quantity
 * Returns the highest tier that matches the quantity
 */
function findApplicableTier(
  quantity: number,
  tiers: TieredDiscountTier[]
): TieredDiscountTier | null {
  // Sort tiers by minQuantity descending to find highest applicable tier
  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);

  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      // Check if quantity doesn't exceed maxQuantity (if set)
      if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
        return tier;
      }
    }
  }

  return null;
}

/**
 * Calculate discount amount from a tier
 */
function calculateTierDiscount(
  basePrice: number,
  tier: TieredDiscountTier
): number {
  if (tier.type === 'percentage') {
    return (basePrice * tier.value) / 100;
  } else {
    return tier.value;
  }
}

// ============================================================================
// MAIN DISCOUNT CALCULATION
// ============================================================================

/**
 * Calculate discount for a single item
 * This is the unified function used across the entire frontend
 *
 * @param variant - The product variant
 * @param quantity - Quantity being purchased
 * @param productParent - The parent product (needed for legacy tiered discounts)
 * @param allCartItems - All items in cart (for grouped quantity calculation in parent tiered discounts)
 * @returns Complete discount calculation result
 */
export function calculateItemDiscount(
  variant: ProductVariant,
  quantity: number,
  productParent?: ProductParent,
  allCartItems?: Array<{ variant: ProductVariant; quantity: number; productParent?: ProductParent }>
): CartItemDiscount {
  const originalPrice = variant.price;
  let currentPrice = variant.price;
  let totalDiscountPerUnit = 0;
  let appliedFixedDiscount = null;
  let appliedTier = null;

  // =========================================================================
  // PRIORITY 1: Variant Fixed Discount
  // =========================================================================

  if (variant.fixedDiscount?.enabled) {
    const isValid = isDateValid(
      variant.fixedDiscount.startDate,
      variant.fixedDiscount.endDate
    );

    if (isValid) {
      let fixedDiscount = 0;

      if (variant.fixedDiscount.type === 'percentage') {
        fixedDiscount = (currentPrice * variant.fixedDiscount.value) / 100;
      } else {
        fixedDiscount = variant.fixedDiscount.value;
      }

      totalDiscountPerUnit += fixedDiscount;
      currentPrice -= fixedDiscount;

      appliedFixedDiscount = {
        type: variant.fixedDiscount.type,
        value: variant.fixedDiscount.value,
      };
    }
  }

  // =========================================================================
  // PRIORITY 2: Variant Tiered Discount (on discounted price)
  // =========================================================================

  if (variant.tieredDiscount?.active && variant.tieredDiscount.tiers.length > 0) {
    const isValid = isDateValid(
      variant.tieredDiscount.startDate,
      variant.tieredDiscount.endDate
    );

    if (isValid) {
      const tier = findApplicableTier(quantity, variant.tieredDiscount.tiers);

      if (tier) {
        const tierDiscount = calculateTierDiscount(currentPrice, tier);
        totalDiscountPerUnit += tierDiscount;
        currentPrice -= tierDiscount;

        appliedTier = {
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          type: tier.type,
          value: tier.value,
          source: 'variant-tiered' as const,
        };
      }
    }
  }

  // =========================================================================
  // PRIORITY 3: Parent Tiered Discount (legacy - only if no other discounts)
  // =========================================================================

  if (
    totalDiscountPerUnit === 0 &&
    productParent?.tieredDiscounts &&
    productParent.tieredDiscounts.length > 0
  ) {
    for (const tieredDiscount of productParent.tieredDiscounts) {
      if (!tieredDiscount.active) continue;

      const isValid = isDateValid(
        tieredDiscount.startDate,
        tieredDiscount.endDate
      );

      if (!isValid) continue;

      // For products WITHOUT variants (attribute = null)
      if (!tieredDiscount.attribute || !tieredDiscount.attributeValue) {
        const tier = findApplicableTier(quantity, tieredDiscount.tiers);

        if (tier) {
          const tierDiscount = calculateTierDiscount(originalPrice, tier);
          totalDiscountPerUnit = tierDiscount;
          currentPrice = originalPrice - tierDiscount;

          appliedTier = {
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity,
            type: tier.type,
            value: tier.value,
            source: 'parent-tiered' as const,
          };
          break;
        }
      }

      // For products WITH variants - check if variant matches attribute
      const variantAttributeValue = variant.attributes[tieredDiscount.attribute];

      if (variantAttributeValue === tieredDiscount.attributeValue) {
        // Group quantity by same attribute value across all cart items
        let groupedQuantity = quantity;

        if (allCartItems && allCartItems.length > 0) {
          groupedQuantity = allCartItems
            .filter((item) => {
              if (!item.productParent || typeof item.productParent === 'string') {
                return false;
              }
              if (item.productParent._id !== productParent._id) {
                return false;
              }

              return (
                item.variant.attributes[tieredDiscount.attribute] ===
                tieredDiscount.attributeValue
              );
            })
            .reduce((sum, item) => sum + item.quantity, 0);
        }

        const tier = findApplicableTier(groupedQuantity, tieredDiscount.tiers);

        if (tier) {
          const tierDiscount = calculateTierDiscount(originalPrice, tier);
          totalDiscountPerUnit = tierDiscount;
          currentPrice = originalPrice - tierDiscount;

          appliedTier = {
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity,
            type: tier.type,
            value: tier.value,
            source: 'parent-tiered' as const,
          };
          break;
        }
      }
    }
  }

  // =========================================================================
  // FINAL CALCULATIONS
  // =========================================================================

  const finalPrice = Math.max(0, currentPrice); // Ensure price is never negative
  const subtotal = finalPrice * quantity;
  const totalDiscount = totalDiscountPerUnit * quantity;

  return {
    originalPrice,
    finalPrice: Math.round(finalPrice),
    discountPerUnit: Math.round(totalDiscountPerUnit),
    appliedTier,
    appliedFixedDiscount,
    quantity,
    subtotal: Math.round(subtotal),
    totalDiscount: Math.round(totalDiscount),
  };
}

// ============================================================================
// BATCH CALCULATIONS
// ============================================================================

/**
 * Calculate discounts for all items in a cart
 * Used by CartStore to recalculate totals
 */
export function calculateCartDiscounts(
  items: Array<{
    variant: ProductVariant;
    quantity: number;
    productParent: ProductParent;
  }>
): {
  items: Array<CartItemDiscount & { variantId: string }>;
  subtotal: number;
  totalDiscount: number;
  total: number;
} {
  const calculatedItems = items.map((item) => {
    const discount = calculateItemDiscount(
      item.variant,
      item.quantity,
      item.productParent,
      items
    );

    return {
      variantId: item.variant._id,
      ...discount,
    };
  });

  const subtotal = calculatedItems.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0
  );

  const totalDiscount = calculatedItems.reduce(
    (sum, item) => sum + item.totalDiscount,
    0
  );

  const total = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal),
    totalDiscount: Math.round(totalDiscount),
    total: Math.round(total),
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get discount badge text for displaying in UI
 * Used by ProductCard to show discount badges
 */
export function getDiscountBadge(
  variant: ProductVariant,
  productParent?: ProductParent
): string | null {
  const now = new Date();

  // Check fixed discount
  if (variant.fixedDiscount?.enabled) {
    const isValid = isDateValid(
      variant.fixedDiscount.startDate,
      variant.fixedDiscount.endDate
    );

    if (isValid) {
      if (variant.fixedDiscount.badge) {
        return variant.fixedDiscount.badge;
      }

      const value = variant.fixedDiscount.value;
      return variant.fixedDiscount.type === 'percentage'
        ? `-${value}%`
        : `-$${value.toLocaleString()}`;
    }
  }

  // Check variant tiered discount
  if (variant.tieredDiscount?.active && variant.tieredDiscount.tiers.length > 0) {
    const isValid = isDateValid(
      variant.tieredDiscount.startDate,
      variant.tieredDiscount.endDate
    );

    if (isValid) {
      if (variant.tieredDiscount.badge) {
        return variant.tieredDiscount.badge;
      }

      const firstTier = variant.tieredDiscount.tiers[0];
      const discount = calculateItemDiscount(variant, firstTier.minQuantity, productParent);

      return `Desde ${firstTier.minQuantity} un $${discount.finalPrice.toLocaleString()} c/u`;
    }
  }

  // Check parent tiered discount
  if (productParent?.tieredDiscounts && productParent.tieredDiscounts.length > 0) {
    const activeDiscount = productParent.tieredDiscounts.find((d) => {
      if (!d.active) return false;
      return isDateValid(d.startDate, d.endDate);
    });

    if (activeDiscount && activeDiscount.tiers.length > 0) {
      const firstTier = activeDiscount.tiers[0];
      const discount = calculateItemDiscount(variant, firstTier.minQuantity, productParent);

      return `Desde ${firstTier.minQuantity} un $${discount.finalPrice.toLocaleString()} c/u`;
    }
  }

  return null;
}

/**
 * Check if variant has any active discount
 */
export function hasActiveDiscount(
  variant: ProductVariant,
  productParent?: ProductParent
): boolean {
  // Check fixed discount
  if (variant.fixedDiscount?.enabled) {
    if (isDateValid(variant.fixedDiscount.startDate, variant.fixedDiscount.endDate)) {
      return true;
    }
  }

  // Check variant tiered discount
  if (variant.tieredDiscount?.active && variant.tieredDiscount.tiers.length > 0) {
    if (isDateValid(variant.tieredDiscount.startDate, variant.tieredDiscount.endDate)) {
      return true;
    }
  }

  // Check parent tiered discount
  if (productParent?.tieredDiscounts && productParent.tieredDiscounts.length > 0) {
    return productParent.tieredDiscounts.some((d) => {
      if (!d.active) return false;
      return isDateValid(d.startDate, d.endDate);
    });
  }

  return false;
}

/**
 * Get discount tiers for display (used in tooltips)
 * Returns formatted tier information for UI display
 */
export function getDiscountTiers(
  variant: ProductVariant,
  productParent?: ProductParent
): Array<{ range: string; price: string; discount: string }> | null {
  // Calculate base price after fixed discount (if any)
  let basePrice = variant.price;

  if (variant.fixedDiscount?.enabled) {
    const isValid = isDateValid(
      variant.fixedDiscount.startDate,
      variant.fixedDiscount.endDate
    );

    if (isValid) {
      if (variant.fixedDiscount.type === 'percentage') {
        basePrice -= (basePrice * variant.fixedDiscount.value) / 100;
      } else {
        basePrice -= variant.fixedDiscount.value;
      }
    }
  }

  // Show variant tiered discount tiers
  if (variant.tieredDiscount?.active && variant.tieredDiscount.tiers.length > 0) {
    const isValid = isDateValid(
      variant.tieredDiscount.startDate,
      variant.tieredDiscount.endDate
    );

    if (isValid) {
      return variant.tieredDiscount.tiers.map((tier) => {
        const tierDiscount = calculateTierDiscount(basePrice, tier);
        const finalPrice = basePrice - tierDiscount;

        return {
          range: tier.maxQuantity
            ? `${tier.minQuantity}-${tier.maxQuantity} un`
            : `${tier.minQuantity}+ un`,
          price: `$${Math.round(finalPrice).toLocaleString()}`,
          discount: tier.type === 'percentage' ? `${tier.value}%` : `$${tier.value}`,
        };
      });
    }
  }

  // Show parent tiered discount tiers (legacy)
  if (productParent?.tieredDiscounts && productParent.tieredDiscounts.length > 0) {
    const activeDiscount = productParent.tieredDiscounts.find((d) => {
      if (!d.active) return false;
      return isDateValid(d.startDate, d.endDate);
    });

    if (activeDiscount && activeDiscount.tiers.length > 0) {
      return activeDiscount.tiers.map((tier) => {
        const tierDiscount = calculateTierDiscount(variant.price, tier);
        const finalPrice = variant.price - tierDiscount;

        return {
          range: tier.maxQuantity
            ? `${tier.minQuantity}-${tier.maxQuantity} un`
            : `${tier.minQuantity}+ un`,
          price: `$${Math.round(finalPrice).toLocaleString()}`,
          discount: tier.type === 'percentage' ? `${tier.value}%` : `$${tier.value}`,
        };
      });
    }
  }

  return null;
}
