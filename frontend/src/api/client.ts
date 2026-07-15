import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { Role } from '../types/models'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const TOKEN_KEYS = {
  access: 'bml_access',
  refresh: 'bml_refresh',
  role: 'bml_role',
  email: 'bml_email',
} as const

interface SaveTokensInput {
  access?: string
  refresh?: string
  role?: Role
  email?: string
}

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(TOKEN_KEYS.access)
  },
  get refresh(): string | null {
    return localStorage.getItem(TOKEN_KEYS.refresh)
  },
  save({ access, refresh, role, email }: SaveTokensInput): void {
    if (access) localStorage.setItem(TOKEN_KEYS.access, access)
    if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh)
    if (role) localStorage.setItem(TOKEN_KEYS.role, role)
    if (email) localStorage.setItem(TOKEN_KEYS.email, email)
  },
  clear(): void {
    Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k))
  },
}

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshing: Promise<{ data: { access: string } }> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status
    const isRefreshCall = original?.url?.includes('/token/refresh')

    if (status === 401 && original && !original._retry && !isRefreshCall && tokenStore.refresh) {
      original._retry = true
      try {
        refreshing =
          refreshing ||
          axios.post(`${BASE_URL}/token/refresh/`, { refresh: tokenStore.refresh })
        const { data } = await refreshing
        refreshing = null
        tokenStore.save({ access: data.access })
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (e) {
        refreshing = null
        tokenStore.clear()
        window.location.href = '/login'
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback
  }
  const data = error.response?.data as unknown
  if (!data) return error.message || fallback
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    if (typeof obj.detail === 'string') return obj.detail
    const parts: string[] = []
    for (const [key, val] of Object.entries(obj)) {
      const text = Array.isArray(val) ? val.join(' ') : String(val)
      parts.push(key === 'non_field_errors' ? text : `${key}: ${text}`)
    }
    if (parts.length) return parts.join(' · ')
  }
  return fallback
}

export default api
