import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { isMockMode } from '@/utils/mockAuth'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const createMockModeError = (): AxiosError => {
  const error = new Error('Mock mode is enabled - backend requests are blocked')
  return error as AxiosError
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - HARD BLOCK in mock mode
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (isMockMode()) {
      console.warn('[apiClient] BLOCKED backend request in mock mode:', config.method?.toUpperCase(), config.url)
      return Promise.reject(createMockModeError())
    }

    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - skip auth refresh in mock mode
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (isMockMode()) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          useAuthStore.getState().setTokens(access_token, refresh_token)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`
          }
          return api(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
