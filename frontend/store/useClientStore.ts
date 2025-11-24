import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ClientUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'cliente';
  createdAt: string;
}

interface ClientState {
  user: ClientUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
}

interface ClientActions {
  setUser: (user: ClientUser | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

type ClientStore = ClientState & ClientActions;

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        // Clear token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('client-token');
        }
        set({ user: null, isAuthenticated: false });
      },
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'client-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
