import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartItem,
  Cart,
  ProductParent,
  ProductVariant,
  TieredDiscountTier,
} from '@/types';

interface CartStore extends Cart {
  // Actions
  addItem: (
    productParent: ProductParent,
    variant: ProductVariant,
    quantity?: number
  ) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;

  // Helpers
  getItem: (variantId: string) => CartItem | undefined;
  getItemCount: () => number;
}

// ============================================================================
// DISCOUNT CALCULATION HELPERS
// ============================================================================

/**
 * Calculate discount for a specific variant based on quantity
 * Implements tiered discount logic by attribute
 */
function calculateVariantDiscount(
  productParent: ProductParent,
  variant: ProductVariant,
  quantity: number,
  allItems: CartItem[]
): number {
  if (!productParent.tieredDiscounts || productParent.tieredDiscounts.length === 0) {
    return 0;
  }

  // Find applicable tiered discount
  for (const tieredDiscount of productParent.tieredDiscounts) {
    if (!tieredDiscount.active) continue;

    // Check if dates are valid
    if (tieredDiscount.startDate && new Date(tieredDiscount.startDate) > new Date()) {
      continue;
    }
    if (tieredDiscount.endDate && new Date(tieredDiscount.endDate) < new Date()) {
      continue;
    }

    // For products WITHOUT variants (attribute = null)
    if (!tieredDiscount.attribute || !tieredDiscount.attributeValue) {
      return calculateTierDiscount(variant.price, quantity, tieredDiscount.tiers);
    }

    // For products WITH variants - check if variant matches attribute
    const variantAttributeValue = variant.attributes[tieredDiscount.attribute];

    if (variantAttributeValue === tieredDiscount.attributeValue) {
      // Group quantity by same attribute value across all cart items
      const groupedQuantity = allItems
        .filter((item) => {
          if (typeof item.productParent === 'string') return false;
          if (item.productParent._id !== productParent._id) return false;

          const itemVariant = item.variant;
          return itemVariant.attributes[tieredDiscount.attribute] === tieredDiscount.attributeValue;
        })
        .reduce((sum, item) => sum + item.quantity, 0);

      return calculateTierDiscount(variant.price, groupedQuantity, tieredDiscount.tiers);
    }
  }

  return 0;
}

/**
 * Calculate discount amount based on tier
 */
function calculateTierDiscount(
  price: number,
  quantity: number,
  tiers: TieredDiscountTier[]
): number {
  // Sort tiers by minQuantity descending to find the highest applicable tier
  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);

  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
        if (tier.type === 'percentage') {
          return (price * tier.value) / 100;
        } else {
          return tier.value;
        }
      }
    }
  }

  return 0;
}

/**
 * Recalculate all cart totals
 */
function recalculateTotals(items: CartItem[]): {
  subtotal: number;
  totalDiscount: number;
  total: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;

  // First pass: calculate subtotals and discounts
  const updatedItems = items.map((item) => {
    const unitPrice = item.variant.price;
    const discount = calculateVariantDiscount(
      item.productParent as ProductParent,
      item.variant,
      item.quantity,
      items
    );
    const discountedPrice = unitPrice - discount;
    const itemSubtotal = discountedPrice * item.quantity;
    const itemTotalDiscount = discount * item.quantity;

    subtotal += unitPrice * item.quantity;
    totalDiscount += itemTotalDiscount;

    return {
      ...item,
      unitPrice,
      discount,
      subtotal: itemSubtotal,
    };
  });

  const total = subtotal - totalDiscount;

  return {
    subtotal,
    totalDiscount,
    total,
  };
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      subtotal: 0,
      totalDiscount: 0,
      total: 0,
      itemCount: 0,

      // Add item to cart
      addItem: (productParent, variant, quantity = 1) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) => item.variantId === variant._id
        );

        let newItems: CartItem[];

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          newItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item
          const newItem: CartItem = {
            variantId: variant._id,
            productParent,
            variant,
            quantity,
            unitPrice: variant.price,
            discount: 0,
            subtotal: 0,
          };
          newItems = [...items, newItem];
        }

        // Recalculate with updated items
        const totals = recalculateTotals(newItems);

        // Update items with calculated values
        const finalItems = newItems.map((item) => {
          const discount = calculateVariantDiscount(
            item.productParent as ProductParent,
            item.variant,
            item.quantity,
            newItems
          );
          const discountedPrice = item.variant.price - discount;

          return {
            ...item,
            discount,
            subtotal: discountedPrice * item.quantity,
          };
        });

        set({
          items: finalItems,
          ...totals,
          itemCount: finalItems.reduce((sum, item) => sum + item.quantity, 0),
        });
      },

      // Remove item from cart
      removeItem: (variantId) => {
        const newItems = get().items.filter((item) => item.variantId !== variantId);
        const totals = recalculateTotals(newItems);

        set({
          items: newItems,
          ...totals,
          itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
        });
      },

      // Update item quantity
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        const newItems = get().items.map((item) =>
          item.variantId === variantId ? { ...item, quantity } : item
        );

        const totals = recalculateTotals(newItems);

        // Update items with recalculated values
        const finalItems = newItems.map((item) => {
          const discount = calculateVariantDiscount(
            item.productParent as ProductParent,
            item.variant,
            item.quantity,
            newItems
          );
          const discountedPrice = item.variant.price - discount;

          return {
            ...item,
            discount,
            subtotal: discountedPrice * item.quantity,
          };
        });

        set({
          items: finalItems,
          ...totals,
          itemCount: finalItems.reduce((sum, item) => sum + item.quantity, 0),
        });
      },

      // Clear cart
      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          totalDiscount: 0,
          total: 0,
          itemCount: 0,
        });
      },

      // Get specific item
      getItem: (variantId) => {
        return get().items.find((item) => item.variantId === variantId);
      },

      // Get total item count
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'quelita-cart', // localStorage key
      // Only persist items, recalculate totals on rehydration
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state && state.items.length > 0) {
          const totals = recalculateTotals(state.items);
          state.subtotal = totals.subtotal;
          state.totalDiscount = totals.totalDiscount;
          state.total = totals.total;
          state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
        }
      },
    }
  )
);

export default useCartStore;
