import type { UserBrief, UserRole } from '@/types'

// Mock users for demo (no backend required)
export const MOCK_USERS = {
  admin: {
    id: 'mock-admin-001',
    email: 'admin@cloudjudge.com',
    full_name: 'System Administrator',
    role: 'admin' as UserRole,
    avatar_url: null,
  },
  instructor: {
    id: 'mock-instructor-001',
    email: 'instructor@cloudjudge.com',
    full_name: 'John Instructor',
    role: 'instructor' as UserRole,
    avatar_url: null,
  },
  student: {
    id: 'mock-student-001',
    email: 'student@cloudjudge.com',
    full_name: 'Jane Student',
    role: 'student' as UserRole,
    avatar_url: null,
  },
}

// Demo passwords
export const MOCK_PASSWORDS: Record<string, string> = {
  'admin@cloudjudge.com': 'admin123',
  'instructor@cloudjudge.com': 'instructor123',
  'student@cloudjudge.com': 'student123',
}

// Mock JWT tokens (base64 encoded, not cryptographically secure)
export const createMockToken = (userId: string, role: UserRole): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: userId,
    role: role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    iat: Date.now(),
  }))
  const signature = btoa('mock-signature')
  return `${header}.${payload}.${signature}`
}

// Mock token pair
export const createMockTokens = (role: UserRole, userId: string) => ({
  access_token: createMockToken(userId, role),
  refresh_token: createMockToken(`${userId}-refresh`, role),
  token_type: 'bearer' as const,
  expires_in: 86400,
})

// Validate mock credentials
export const validateMockCredentials = (email: string, password: string): UserBrief | null => {
  const storedPassword = MOCK_PASSWORDS[email]
  const isValid = storedPassword === password
  console.log('[mockAuth] validateMockCredentials:', { email, isValid, storedPassword: storedPassword ? '***' : 'none' })

  if (isValid) {
    const roleKey = Object.keys(MOCK_USERS).find(
      key => MOCK_USERS[key as keyof typeof MOCK_USERS].email === email
    ) as keyof typeof MOCK_USERS | undefined

    if (roleKey) {
      console.log('[mockAuth] validateMockCredentials: found user', roleKey)
      return MOCK_USERS[roleKey]
    }
  }
  console.log('[mockAuth] validateMockCredentials: invalid credentials')
  return null
}

// Check if VITE_MOCK_AUTH env is set to 'true'
const isEnvMockMode = (): boolean => {
  const result = import.meta.env.VITE_MOCK_AUTH === 'true'
  console.log('[mockAuth] isEnvMockMode:', result, '| VITE_MOCK_AUTH =', JSON.stringify(import.meta.env.VITE_MOCK_AUTH))
  return result
}

// Check if mock mode is enabled via localStorage (runtime toggle)
const isLocalStorageMockMode = (): boolean => {
  const lsValue = localStorage.getItem('mock_auth_enabled')
  const result = lsValue === 'true'
  console.log('[mockAuth] isLocalStorageMockMode:', result, '| localStorage.mock_auth_enabled =', JSON.stringify(lsValue))
  return result
}

// Check if running in mock mode (env takes precedence)
export const isMockMode = (): boolean => {
  const envResult = isEnvMockMode()
  const lsResult = isLocalStorageMockMode()
  const finalResult = envResult || lsResult
  console.log('[mockAuth] isMockMode FINAL:', finalResult, '(env:', envResult, ', ls:', lsResult, ')')
  return finalResult
}

// Enable/disable mock mode (only affects localStorage)
export const setMockMode = (enabled: boolean): void => {
  console.log('[mockAuth] setMockMode called with:', enabled)

  // If env is set, localStorage doesn't matter
  if (isEnvMockMode()) {
    console.log('[mockAuth] setMockMode: SKIPPED because VITE_MOCK_AUTH env is set')
    return
  }

  localStorage.setItem('mock_auth_enabled', enabled ? 'true' : 'false')
  console.log('[mockAuth] setMockMode: saved to localStorage =', enabled ? 'true' : 'false')
}

// Check if mock mode is locked by env (cannot be toggled at runtime)
export const isMockModeLockedByEnv = (): boolean => {
  const result = isEnvMockMode()
  console.log('[mockAuth] isMockModeLockedByEnv:', result)
  return result
}
