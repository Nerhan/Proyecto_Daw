import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { resourcesForRole, canCreate, canUpdate, canDelete } from '../config/resources'
import { Icon } from '../components/Icon'
import type { ApiRecord, Paginated, Role } from '../types/models'

const ROLE_INTRO: Record<Role, { title: string; desc: string; badge: string; roleName: string }> = {
  admin: {
    title: 'Panel de Administración',
    desc: 'Tienes control total del sistema: gestión de usuarios, personal, proyectos, muestras, protocolos y resultados.',
    badge: 'badge-suspended',
    roleName: 'Administrador',
  },
  scientist: {
    title: 'Panel del Científico',
    desc: 'Gestiona personal, proyectos, muestras, protocolos y resultados de investigación. Puedes dar de alta cuentas de asistente; la administración completa de usuarios está reservada al administrador.',
    badge: 'badge-blue',
    roleName: 'Científico',
  },
  assistant: {
    title: 'Panel del Asistente',
    desc: 'Registra muestras y resultados de pruebas del laboratorio. Puedes consultar proyectos, protocolos y personal en modo lectura.',
    badge: 'badge-active',
    roleName: 'Asistente',
  },
}

export default function Dashboard() {
  const { role, session } = useAuth()
  const resources = resourcesForRole(role)
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const intro = role ? ROLE_INTRO[role] : ROLE_INTRO.assistant

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all(
      resources.map((r) =>
        api
          .get<Paginated<ApiRecord> | ApiRecord[]>(`/${r.endpoint}/`, { params: { page_size: 1 } })
          .then((res): [string, number | null] => {
            const count = Array.isArray(res.data) ? res.data.length : res.data.count
            return [r.key, count]
          })
          .catch((): [string, number | null] => [r.key, null])
      )
    ).then((entries) => {
      if (!cancelled) {
        setCounts(Object.fromEntries(entries))
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  return (
    <div>
      {/* Hero */}
      <div className="card card-pad" style={{ marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(41,182,255,0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Bienvenido de nuevo
        </div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: 6 }}>{intro.title}</h2>
        <p className="text-dim" style={{ maxWidth: 620, lineHeight: 1.6 }}>
          {intro.desc}
        </p>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${intro.badge}`}>{intro.roleName}</span>
          <span className="cell-mono">{session?.email}</span>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="grid stat-grid">
          {resources.map((r) => {
            const writable = canCreate(r, role) || canUpdate(r, role) || canDelete(r, role)
            return (
              <Link key={r.key} to={`/r/${r.key}`} className="card stat">
                <Icon name={r.icon} className="stat-ico" size={30} />
                <div className="stat-label">{r.label}</div>
                <div className="stat-value">{counts[r.key] ?? '—'}</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '0.74rem',
                    color: 'var(--text-faint)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {writable ? 'Lectura y escritura' : 'Solo lectura'}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Accesos rápidos de escritura */}
      <div style={{ marginTop: 26 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Acciones rápidas
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {resources
            .filter((r) => canCreate(r, role))
            .map((r) => (
              <Link key={r.key} to={`/r/${r.key}`} className="btn">
                <Icon name={r.icon} size={16} /> Gestionar {r.label.toLowerCase()}
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
