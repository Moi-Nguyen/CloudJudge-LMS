import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserBrief, UserRole } from '@/types'
import { authApi } from '@/api/endpoints'
import {
  isMockMode,
  validateMockCredentials,
  createMockTokens,
  MOCK_USERS,
} from '@/utils/mockAuth'

interface AuthState {
  user: UserBrief | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isMockAuth: boolean

  setUser: (user: UserBrief | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setLoading: (loading: boolean) => void
  login: (accessToken: string, refreshToken: string, user: UserBrief, isMock?: boolean) => void
  logout: () => void
  initializeAuth: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
  mockLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
}

// Get redirect path by role
export const getRedirectPathByRole = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'instructor':
      return '/instructor'
    case 'student':
      return '/student'
    default:
      return '/dashboard'
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
      isMockAuth: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setLoading: (loading) => set({ isLoading: loading }),

      login: (accessToken, refreshToken, user, isMock = false) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
          isMockAuth: isMock,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          isMockAuth: false,
        }),

      // Initialize auth state - call this on app mount
      initializeAuth: async () => {
        const { accessToken, refreshToken, isMockAuth } = get()
        const mockMode = isMockMode()

        // MOCK MODE: ALWAYS skip backend, no matter what tokens exist
        if (mockMode) {

          // If we have mock tokens AND user, restore session
          if (isMockAuth && accessToken && refreshToken) {
            const mockUser = get().user
            if (mockUser) {
              set({ isAuthenticated: true, isLoading: false })
              return
            }
          }

          // If we have tokens but not mock auth (e.g., switched from real to mock),
          // or no tokens at all - just stop loading, don't call backend
          set({ isMockAuth: true, isLoading: false })
          return
        }

        // REAL MODE: No tokens stored, just stop loading
        if (!accessToken || !refreshToken) {
          set({ isLoading: false })
          return
        }

        // REAL MODE: Try to validate token by calling /auth/me
        try {
          const user = await authApi.getMe()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (error) {
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

      // Mock login handler
      mockLogin: async (email, password) => {
        const validatedUser = validateMockCredentials(email, password)

        if (!validatedUser) {
          return { success: false, error: 'Email hoặc mật khẩu không đúng' }
        }

        // Get the role to create appropriate tokens
        const roleKey = Object.keys(MOCK_USERS).find(
          key => MOCK_USERS[key as keyof typeof MOCK_USERS].email === email
        ) as keyof typeof MOCK_USERS | undefined

        if (!roleKey) {
          return { success: false, error: 'Không tìm thấy người dùng' }
        }

        const tokens = createMockTokens(roleKey as UserRole, validatedUser.id)

        // Store in Zustand
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          user: validatedUser,
          isAuthenticated: true,
          isLoading: false,
          isMockAuth: true,
        })

        return { success: true }
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
        isMockAuth: state.isMockAuth,
      }),
    }
  )
)
