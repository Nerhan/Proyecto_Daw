import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { resourcesForRole, canCreate, RESOURCE_BY_KEY, type ResourceConfig } from '../config/resources'
import { CommandPalette, type PaletteItem } from './CommandPalette'
import { Icon } from './Icon'
import type { Role } from '../types/models'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  scientist: 'Científico',
  assistant: 'Asistente',
}
const ROLE_BADGE: Record<Role, string> = {
  admin: 'badge-suspended',
  scientist: 'badge-blue',
  assistant: 'badge-active',
}

function groupBy<T>(list: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return list.reduce<Record<string, T[]>>((acc, item) => {
    const k = keyFn(item)
    ;(acc[k] = acc[k] || []).push(item)
    return acc
  }, {})
}

export default function Layout() {
  const { session, role, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState(false)

  const resources = resourcesForRole(role)
  const grouped = groupBy<ResourceConfig>(resources, (r) => r.group)
  const initials = (session?.email || '?').slice(0, 2).toUpperCase()

  const path = location.pathname
  const currentTitle =
    path === '/'
      ? 'Panel de control'
      : path === '/profile'
        ? 'Mi perfil'
        : path.startsWith('/projects/')
          ? 'Detalle de proyecto'
          : RESOURCE_BY_KEY[path.split('/')[2]]?.label || 'BioMatrix Labs'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const paletteItems = useMemo<PaletteItem[]>(
    () => [
      { id: 'dash', label: 'Panel de control', hint: 'Ir a', icon: 'dashboard', run: () => navigate('/') },
      ...resources.map(
        (r): PaletteItem => ({ id: r.key, label: r.label, hint: 'Ir a', icon: r.icon, run: () => navigate(`/r/${r.key}`) })
      ),
      { id: 'profile', label: 'Mi perfil', hint: 'Ir a', icon: 'assistant', run: () => navigate('/profile') },
      ...resources
        .filter((r) => canCreate(r, role))
        .map(
          (r): PaletteItem => ({
            id: `new-${r.key}`,
            label: `Nuevo ${r.singular.toLowerCase()}`,
            hint: 'Crear',
            icon: 'plus',
            run: () => navigate(`/r/${r.key}?new=1`),
          })
        ),
      {
        id: 'theme',
        label: theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
        hint: 'Acción',
        icon: theme === 'dark' ? 'sun' : 'moon',
        run: toggle,
      },
      { id: 'logout', label: 'Cerrar sesión', hint: 'Acción', icon: 'logout', run: logout },
    ],
    [resources, role, theme, navigate, toggle, logout]
  )

  return (
    <div className="app-shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logo.svg" className="brand-logo" alt="BioMatrix Labs" />
          <div>
            <div className="brand-name">BioMatrix</div>
            <div className="brand-sub">Labs</div>
          </div>
        </div>

        <nav className="nav" onClick={() => setOpen(false)}>
          <NavLink to="/" end className="nav-item">
            <Icon name="dashboard" className="nav-icon" />
            Panel de control
          </NavLink>

          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="nav-section">{group}</div>
              {items.map((r) => (
                <NavLink key={r.key} to={`/r/${r.key}`} className="nav-item">
                  <Icon name={r.icon} className="nav-icon" />
                  {r.label}
                  {role && !r.create.includes(role) && !r.update.includes(role) && (
                    <Icon name="lock" size={12} className="nav-lock" />
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <Link to="/profile" className="user-chip-link" title="Ver mi perfil" onClick={() => setOpen(false)}>
              <div className="avatar">{initials}</div>
              <div className="user-meta">
                <div className="user-email">{session?.email}</div>
                {role && (
                  <span className={`badge ${ROLE_BADGE[role]}`} style={{ marginTop: 4 }}>
                    {ROLE_LABEL[role]}
                  </span>
                )}
              </div>
            </Link>
            <button className="btn-icon btn-ghost" onClick={logout} title="Cerrar sesión">
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="theme-toggle menu-btn" onClick={() => setOpen(true)} aria-label="Menú">
            <Icon name="menu" />
          </button>
          <h1>{currentTitle}</h1>
          <div className="topbar-spacer" />
          <button className="palette-btn" onClick={() => setPalette(true)} title="Paleta de comandos">
            <Icon name="search" size={15} />
            <span>Buscar…</span>
            <span className="kbd">Ctrl K</span>
          </button>
          <button
            className="theme-toggle"
            onClick={toggle}
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-label="Cambiar tema"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} items={paletteItems} />
    </div>
  )
}
