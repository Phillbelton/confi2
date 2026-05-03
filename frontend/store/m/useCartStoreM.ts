import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { effectiveUnitPrice } from '@/lib/discountCalculator';

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  // Calculados
  pricePerUnit: number; // precio efectivo según tier
  subtotal: number;
  discount: number; // (unitPrice - pricePerUnit) * quantity
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  itemCount: number;
}

interface CartStoreM extends CartState {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string) => CartItem | undefined;
}

function recalcItems(items: CartItem[]): {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  itemCount: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let itemCount = 0;
  const updated = items.map((it) => {
    const ppu = effectiveUnitPrice(it.product, it.quantity);
    const lineSubtotal = ppu * it.quantity;
    const lineDiscount = Math.max(0, (it.product.unitPrice - ppu) * it.quantity);
    subtotal += it.product.unitPrice * it.quantity;
    totalDiscount += lineDiscount;
    itemCount += it.quantity;
    return { ...it, pricePerUnit: ppu, subtotal: lineSubtotal, discount: lineDiscount };
  });
  return { items: updated, subtotal, totalDiscount, total: subtotal - totalDiscount, itemCount };
}

export const useCartStoreM = create<CartStoreM>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      totalDiscount: 0,
      total: 0,
      itemCount: 0,

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const idx = items.findIndex((i) => i.productId === product._id);
        let next: CartItem[];
        if (idx >= 0) {
          next = items.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + quantity } : i));
        } else {
          next = [
            ...items,
            {
              productId: product._id,
              product,
              quantity,
              pricePerUnit: product.unitPrice,
              subtotal: 0,
              discount: 0,
            },
          ];
        }
        set(recalcItems(next));
      },

      removeItem: (productId) => {
        const next = get().items.filter((i) => i.productId !== productId);
        set(next.length === 0
          ? { items: [], subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 }
          : recalcItems(next));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) return get().removeItem(productId);
        const next = get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
        set(recalcItems(next));
      },

      clearCart: () => set({ items: [], subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 }),

      getItem: (productId) => get().items.find((i) => i.productId === productId),
    }),
    {
      name: 'quelita-cart-m',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Filtrar items malformados de versiones anteriores (sin product/productId)
        state.items = (state.items || []).filter(
          (it: any) => it && it.productId && it.product && typeof it.product.unitPrice === 'number'
        );
        if (state.items.length > 0) Object.assign(state, recalcItems(state.items));
        else Object.assign(state, { subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 });
      },
    }
  )
);

export default useCartStoreM;
