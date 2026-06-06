import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserBrief, UserRole } from '@/types'
import { authApi } from '@/api/endpoints'

interface AuthState {
  user: UserBrief | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: UserBrief | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setLoading: (loading: boolean) => void
  login: (accessToken: string, refreshToken: string, user: UserBrief) => void
  logout: () => void
  initializeAuth: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

// Helper to call API safely
const callApi = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setLoading: (loading) => set({ isLoading: loading }),

      login: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      // Initialize auth state - call this on app mount
      initializeAuth: async () => {
        const { accessToken, refreshToken } = get()

        // No tokens stored, just stop loading
        if (!accessToken || !refreshToken) {
          set({ isLoading: false })
          return
        }

        // Try to validate token by calling /auth/me
        try {
          const user = await authApi.getMe()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch {
          // Token invalid or backend down - clear auth state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      hasRole: (...roles) => {
        const { user } = get()
        return user ? roles.includes(user.role) : false
      },
    }),
    {
      name: 'auth-storage',
      // Don't persist loading state - always start fresh
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
