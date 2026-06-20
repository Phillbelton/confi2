import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { effectiveUnitPrice, getPresentation, getPrincipal } from '@/lib/discountCalculator';

/** Identidad de una línea de carrito: producto + presentación elegida. */
export const cartLineId = (productId: string, presentationId: string) =>
  `${productId}__${presentationId}`;

export interface CartItem {
  /** `${productId}__${presentationId}` — clave única de la línea. */
  lineId: string;
  productId: string;
  /** Presentación elegida (subdoc `_id`). Por defecto la principal. */
  presentationId: string;
  product: Product;
  quantity: number;
  // Calculados
  pricePerUnit: number; // precio efectivo según el tier de la presentación
  subtotal: number;
  discount: number; // (precio base de la presentación - pricePerUnit) * quantity
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  itemCount: number;
}

interface CartStoreM extends CartState {
  addItem: (product: Product, quantity?: number, presentationId?: string) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (lineId: string) => CartItem | undefined;
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
    // El precio sale de la PRESENTACIÓN elegida (o la principal por defecto).
    const pres = getPresentation(it.product, it.presentationId);
    const ppu = effectiveUnitPrice(pres, it.quantity);
    const base = pres.unitPrice;
    const lineSubtotal = ppu * it.quantity;
    const lineDiscount = Math.max(0, (base - ppu) * it.quantity);
    subtotal += base * it.quantity;
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

      addItem: (product, quantity = 1, presentationId) => {
        const presId = presentationId ?? getPrincipal(product)?._id ?? '';
        const lineId = cartLineId(product._id, presId);
        const items = get().items;
        const idx = items.findIndex((i) => i.lineId === lineId);
        let next: CartItem[];
        if (idx >= 0) {
          next = items.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + quantity } : i));
        } else {
          next = [
            ...items,
            {
              lineId,
              productId: product._id,
              presentationId: presId,
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

      removeItem: (lineId) => {
        const next = get().items.filter((i) => i.lineId !== lineId);
        set(next.length === 0
          ? { items: [], subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 }
          : recalcItems(next));
      },

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) return get().removeItem(lineId);
        const next = get().items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i));
        set(recalcItems(next));
      },

      clearCart: () => set({ items: [], subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 }),

      getItem: (lineId) => get().items.find((i) => i.lineId === lineId),
    }),
    {
      name: 'quelita-cart-m',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Filtrar items malformados de versiones anteriores (sin product/productId).
        const persisted = (state.items ?? []) as Array<Partial<CartItem>>;
        state.items = persisted
          .filter(
            (it): it is CartItem =>
              !!it &&
              typeof it.productId === 'string' &&
              !!it.product &&
              typeof it.product.unitPrice === 'number'
          )
          // Carritos viejos pueden no traer presentationId/lineId → derivarlos.
          .map((it) => {
            const presentationId = it.presentationId || getPrincipal(it.product)?._id || '';
            return { ...it, presentationId, lineId: cartLineId(it.productId, presentationId) };
          });
        if (state.items.length > 0) Object.assign(state, recalcItems(state.items));
        else Object.assign(state, { subtotal: 0, totalDiscount: 0, total: 0, itemCount: 0 });
      },
    }
  )
);

export default useCartStoreM;
