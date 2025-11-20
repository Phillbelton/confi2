import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser } from '@/types/admin';

interface FuncionarioState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sidebarOpen: boolean;
  _hasHydrated: boolean;
}

interface FuncionarioActions {
  setUser: (user: AdminUser | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

type FuncionarioStore = FuncionarioState & FuncionarioActions;

export const useFuncionarioStore = create<FuncionarioStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sidebarOpen: true,
      _hasHydrated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'funcionario-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user and auth status, not UI state
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
