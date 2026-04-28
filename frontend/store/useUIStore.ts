import { create } from 'zustand';

/**
 * Estado de UI global (drawers, modals).
 * Separado de useCartStore porque es estado de UI, no de dominio.
 */
interface UIStore {
  cartSheetOpen: boolean;
  setCartSheetOpen: (open: boolean) => void;
  openCartSheet: () => void;
  closeCartSheet: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  cartSheetOpen: false,
  setCartSheetOpen: (cartSheetOpen) => set({ cartSheetOpen }),
  openCartSheet: () => set({ cartSheetOpen: true }),
  closeCartSheet: () => set({ cartSheetOpen: false }),
}));
