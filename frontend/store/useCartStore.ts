import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Cart, ProductParent, ProductVariant } from '@/types';
import { calculateItemDiscount, calculateCartDiscounts } from '@/lib/discountCalculator';

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
// HELPERS
// ============================================================================

/**
 * Recalculate all cart totals using unified discount calculator
 */
function recalculateTotals(items: CartItem[]): {
  updatedItems: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
} {
  // Prepare items for calculation
  const calculationItems = items.map((item) => ({
    variant: item.variant,
    quantity: item.quantity,
    productParent: item.productParent as ProductParent,
  }));

  // Use unified calculator
  const result = calculateCartDiscounts(calculationItems);

  // Map results back to CartItem structure
  const updatedItems = items.map((item) => {
    const calculatedItem = result.items.find((ci) => ci.variantId === item.variantId);

    if (!calculatedItem) {
      // Fallback if not found (shouldn't happen)
      return {
        ...item,
        unitPrice: item.variant.price,
        discount: 0,
        subtotal: item.variant.price * item.quantity,
      };
    }

    return {
      ...item,
      unitPrice: calculatedItem.originalPrice,
      discount: calculatedItem.discountPerUnit,
      subtotal: calculatedItem.subtotal,
    };
  });

  return {
    updatedItems,
    subtotal: result.subtotal,
    totalDiscount: result.totalDiscount,
    total: result.total,
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

        // Recalculate with unified calculator
        const { updatedItems, subtotal, totalDiscount, total } =
          recalculateTotals(newItems);

        set({
          items: updatedItems,
          subtotal,
          totalDiscount,
          total,
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        });
      },

      // Remove item from cart
      removeItem: (variantId) => {
        const newItems = get().items.filter((item) => item.variantId !== variantId);

        if (newItems.length === 0) {
          set({
            items: [],
            subtotal: 0,
            totalDiscount: 0,
            total: 0,
            itemCount: 0,
          });
          return;
        }

        const { updatedItems, subtotal, totalDiscount, total } =
          recalculateTotals(newItems);

        set({
          items: updatedItems,
          subtotal,
          totalDiscount,
          total,
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
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

        const { updatedItems, subtotal, totalDiscount, total } =
          recalculateTotals(newItems);

        set({
          items: updatedItems,
          subtotal,
          totalDiscount,
          total,
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
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
          const { updatedItems, subtotal, totalDiscount, total } =
            recalculateTotals(state.items);

          state.items = updatedItems;
          state.subtotal = subtotal;
          state.totalDiscount = totalDiscount;
          state.total = total;
          state.itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        }
      },
    }
  )
);

export default useCartStore;
