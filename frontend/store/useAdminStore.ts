import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser } from '@/types/admin';

export type AdminTheme = 'light' | 'dark';

interface AdminState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Escritorio: sidebar expandido (w-64) o colapsado a rail de iconos (w-16). */
  sidebarOpen: boolean;
  /** Móvil: cajón de navegación encima del contenido. Siempre arranca cerrado. */
  mobileNavOpen: boolean;
  /** Tema del panel. Arranca en oscuro (era dark-only antes del rediseño). */
  theme: AdminTheme;
  _hasHydrated: boolean;
}

interface AdminActions {
  setUser: (user: AdminUser | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

type AdminStore = AdminState & AdminActions;

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sidebarOpen: true,
      mobileNavOpen: false,
      theme: 'dark',
      _hasHydrated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        localStorage.removeItem('admin-token');
        set({ user: null, isAuthenticated: false });
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'admin-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Auth + las preferencias de UI que conviene recordar entre sesiones:
        // quien colapsa el sidebar o elige tema claro no quiere repetirlo cada vez.
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
