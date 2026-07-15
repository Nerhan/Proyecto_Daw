import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RESOURCE_BY_KEY } from '../config/resources'

/** Exige sesión activa; si la ruta apunta a un recurso, exige que el rol lo pueda ver. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Guard por recurso: /r/<key>
  const parts = location.pathname.split('/')
  if (parts[1] === 'r') {
    const resource = RESOURCE_BY_KEY[parts[2]]
    if (resource && role && !resource.view.includes(role)) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
