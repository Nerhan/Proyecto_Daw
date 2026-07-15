import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import api, { tokenStore, TOKEN_KEYS } from '../api/client'
import type { LoginResponse, Role } from '../types/models'

interface Session {
  access: string
  role: Role
  email: string
  userId: string | undefined
}

interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  role: Role | undefined
  login: (email: string, password: string) => Promise<LoginResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodeJwt(token: string): { user_id?: string } {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

function isRole(value: string | null): value is Role {
  return value === 'admin' || value === 'scientist' || value === 'assistant'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const access = tokenStore.access
    const storedRole = localStorage.getItem(TOKEN_KEYS.role)
    if (!access || !isRole(storedRole)) return null
    return {
      access,
      role: storedRole,
      email: localStorage.getItem(TOKEN_KEYS.email) ?? '',
      userId: decodeJwt(access).user_id,
    }
  })

  async function login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/token/', { email, password })
    tokenStore.save({ access: data.access, refresh: data.refresh, role: data.role, email })
    setSession({
      access: data.access,
      role: data.role,
      email,
      userId: decodeJwt(data.access).user_id,
    })
    return data
  }

  function logout() {
    tokenStore.clear()
    setSession(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      role: session?.role,
      login,
      logout,
    }),
    [session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return ctx
}
