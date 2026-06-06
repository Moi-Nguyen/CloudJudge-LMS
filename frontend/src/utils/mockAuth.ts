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
export const MOCK_PASSWORDS = {
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
export const validateMockCredentials = (email: string, password: string) => {
  if (MOCK_PASSWORDS[email] === password) {
    const role = Object.keys(MOCK_USERS).find(
      key => MOCK_USERS[key as keyof typeof MOCK_USERS].email === email
    ) as keyof typeof MOCK_USERS | undefined

    if (role) {
      return MOCK_USERS[role]
    }
  }
  return null
}

// Check if running in mock mode (no backend)
export const isMockMode = (): boolean => {
  return import.meta.env.VITE_MOCK_AUTH === 'true' || 
         localStorage.getItem('mock_auth_enabled') === 'true'
}

// Enable/disable mock mode
export const setMockMode = (enabled: boolean): void => {
  localStorage.setItem('mock_auth_enabled', enabled ? 'true' : 'false')
}
