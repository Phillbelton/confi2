import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Cart, ProductParent, ProductVariant } from '@/types';
import { calculateCartDiscounts } from '@/lib/discountCalculator';

interface CartStoreM extends Cart {
  addItem: (
    productParent: ProductParent,
    variant: ProductVariant,
    quantity?: number
  ) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (variantId: string) => CartItem | undefined;
  getItemCount: () => number;
}

function recalculateTotals(items: CartItem[]) {
  const calculationItems = items.map((item) => ({
    variant: item.variant,
    quantity: item.quantity,
    productParent: item.productParent as ProductParent,
  }));

  const result = calculateCartDiscounts(calculationItems);

  const updatedItems = items.map((item) => {
    const ci = result.items.find((c) => c.variantId === item.variantId);
    if (!ci) {
      return {
        ...item,
        unitPrice: item.variant.price,
        discount: 0,
        subtotal: item.variant.price * item.quantity,
      };
    }
    return {
      ...item,
      unitPrice: ci.originalPrice,
      discount: ci.discountPerUnit,
      subtotal: ci.subtotal,
    };
  });

  return {
    updatedItems,
    subtotal: result.subtotal,
    totalDiscount: result.totalDiscount,
    total: result.total,
  };
}

export const useCartStoreM = create<CartStoreM>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      totalDiscount: 0,
      total: 0,
      itemCount: 0,

      addItem: (productParent, variant, quantity = 1) => {
        const items = get().items;
        const idx = items.findIndex((i) => i.variantId === variant._id);

        let newItems: CartItem[];
        if (idx >= 0) {
          newItems = items.map((i, n) =>
            n === idx ? { ...i, quantity: i.quantity + quantity } : i
          );
        } else {
          newItems = [
            ...items,
            {
              variantId: variant._id,
              productParent,
              variant,
              quantity,
              unitPrice: variant.price,
              discount: 0,
              subtotal: 0,
            },
          ];
        }

        const { updatedItems, subtotal, totalDiscount, total } =
          recalculateTotals(newItems);

        set({
          items: updatedItems,
          subtotal,
          totalDiscount,
          total,
          itemCount: updatedItems.reduce((s, i) => s + i.quantity, 0),
        });
      },

      removeItem: (variantId) => {
        const newItems = get().items.filter((i) => i.variantId !== variantId);

        if (newItems.length === 0) {
          set({ items: [], subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 });
          return;
        }

        const { updatedItems, subtotal, totalDiscount, total } =
          recalculateTotals(newItems);

        set({
          items: updatedItems,
          subtotal,
          totalDiscount,
          total,
          itemCount: updatedItems.reduce((s, i) => s + i.quantity, 0),
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        const newItems = get().items.map((i) =>
          i.variantId === variantId ? { ...i, quantity } : i
        );

        const { updatedItems, subtotal, totalDiscount, total } =
          recalculateTotals(newItems);

        set({
          items: updatedItems,
          subtotal,
          totalDiscount,
          total,
          itemCount: updatedItems.reduce((s, i) => s + i.quantity, 0),
        });
      },

      clearCart: () => {
        set({ items: [], subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 });
      },

      getItem: (variantId) => get().items.find((i) => i.variantId === variantId),
      getItemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: 'quelita-cart-m',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state && state.items.length > 0) {
          const { updatedItems, subtotal, totalDiscount, total } =
            recalculateTotals(state.items);
          state.items = updatedItems;
          state.subtotal = subtotal;
          state.totalDiscount = totalDiscount;
          state.total = total;
          state.itemCount = updatedItems.reduce((s, i) => s + i.quantity, 0);
        }
      },
    }
  )
);

export default useCartStoreM;
