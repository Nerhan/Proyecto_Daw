import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { apiErrorMessage } from '../api/client'
import { Icon } from '../components/Icon'

interface LocationState {
  from?: { pathname: string }
}

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    const state = location.state as LocationState | null
    const to = state?.from?.pathname || '/'
    return <Navigate to={to} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      const state = location.state as LocationState | null
      navigate(state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo iniciar sesión. Verifica tus credenciales.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <button
        className="theme-toggle"
        onClick={toggle}
        style={{ position: 'fixed', top: 20, right: 20 }}
        aria-label="Cambiar tema"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
      </button>

      <div className="auth-card card">
        <div className="auth-brand">
          <img src="/vite.svg" className="brand-logo" alt="" />
          <div className="auth-title">BioMatrix Labs</div>
          <div className="eyebrow">Sistema de gestión de laboratorio</div>
        </div>

        {error && <div className="alert alert-err">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email institucional</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="usuario@unsa.edu.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            disabled={loading}
          >
            {loading ? 'Procesando…' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-switch">
          ¿No tienes cuenta? Pídele a un administrador o científico que te dé de alta.
        </p>

        <div className="role-hint">
          <span className="badge badge-suspended">Admin</span>
          <span className="badge badge-blue">Científico</span>
          <span className="badge badge-active">Asistente</span>
        </div>
      </div>
    </div>
  )
}
