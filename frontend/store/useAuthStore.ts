import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type User } from '@/services/auth';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          const user = response.data?.user || null;
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          // Even if server logout fails, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const response = await authService.getMe();
          const user = response.data?.user || null;
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } catch (error) {
          // If auth check fails, clear state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
