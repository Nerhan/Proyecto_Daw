import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { resourcesForRole, RESOURCE_BY_KEY, type ResourceConfig } from '../config/resources'
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
  const [open, setOpen] = useState(false)

  const resources = resourcesForRole(role)
  const grouped = groupBy<ResourceConfig>(resources, (r) => r.group)
  const initials = (session?.email || '?').slice(0, 2).toUpperCase()

  const currentTitle =
    location.pathname === '/'
      ? 'Panel de control'
      : RESOURCE_BY_KEY[location.pathname.split('/')[2]]?.label || 'BioMatrix Labs'

  return (
    <div className="app-shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="/vite.svg" className="brand-logo" alt="" />
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
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <div className="user-email">{session?.email}</div>
              {role && (
                <span className={`badge ${ROLE_BADGE[role]}`} style={{ marginTop: 4 }}>
                  {ROLE_LABEL[role]}
                </span>
              )}
            </div>
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
    </div>
  )
}
