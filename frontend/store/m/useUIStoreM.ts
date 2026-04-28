import { create } from 'zustand';

interface UIStoreM {
  filtersSheetOpen: boolean;
  searchOpen: boolean;
  activeCategory: string | null;
  activeSubcategory: string | null;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'name';

  openFilters: () => void;
  closeFilters: () => void;
  toggleSearch: () => void;
  setCategory: (id: string | null) => void;
  setSubcategory: (id: string | null) => void;
  setSort: (sort: UIStoreM['sort']) => void;
  reset: () => void;
}

export const useUIStoreM = create<UIStoreM>((set) => ({
  filtersSheetOpen: false,
  searchOpen: false,
  activeCategory: null,
  activeSubcategory: null,
  sort: 'newest',

  openFilters: () => set({ filtersSheetOpen: true }),
  closeFilters: () => set({ filtersSheetOpen: false }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  setCategory: (id) => set({ activeCategory: id, activeSubcategory: null }),
  setSubcategory: (id) => set({ activeSubcategory: id }),
  setSort: (sort) => set({ sort }),
  reset: () =>
    set({
      filtersSheetOpen: false,
      searchOpen: false,
      activeCategory: null,
      activeSubcategory: null,
      sort: 'newest',
    }),
}));

export default useUIStoreM;
