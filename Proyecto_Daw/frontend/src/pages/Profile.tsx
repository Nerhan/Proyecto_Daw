import { useEffect, useState, type FormEvent } from 'react'
import api, { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Icon } from '../components/Icon'
import { PasswordStrength } from '../components/PasswordStrength'
import { SkeletonBlock } from '../components/Skeleton'
import { ROLE_LABELS, STATUS_BADGE, statusLabel } from '../utils/cells'
import { fmtDate } from '../utils/format'
import type { Role } from '../types/models'

interface MeData {
  id: string
  email: string
  role: Role
  status: string
  created: string
  profile_details: Record<string, unknown> | null
}

const ROLE_BADGE: Record<Role, string> = {
  admin: 'badge-suspended',
  scientist: 'badge-blue',
  assistant: 'badge-active',
}

export default function Profile() {
  const { session } = useAuth()
  const toast = useToast()
  const [me, setMe] = useState<MeData | null>(null)
  const [current, setCurrent] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<MeData>('/me/')
      .then((r) => setMe(r.data))
      .catch(() => toast.error('No se pudo cargar tu perfil.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSaving(true)
    try {
      await api.post('/me/change-password/', { current_password: current, new_password: nueva })
      toast.success('Contraseña actualizada correctamente.')
      setCurrent('')
      setNueva('')
      setConfirmar('')
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cambiar la contraseña.'))
    } finally {
      setSaving(false)
    }
  }

  const details = me?.profile_details ?? null
  const fullName = details
    ? `${String(details.names ?? '')} ${String(details.father_surname ?? '')} ${String(details.mother_surname ?? '')}`.trim()
    : ''
  const initials = (me?.email ?? session?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <div className="page-in">
      <div className="profile-grid">
        <div className="card card-pad">
          {!me ? (
            <>
              <SkeletonBlock w={200} h={20} />
              <SkeletonBlock w={260} h={12} style={{ marginTop: 14 }} />
              <SkeletonBlock w={180} h={12} style={{ marginTop: 10 }} />
            </>
          ) : (
            <>
              <div className="profile-hero">
                <div className="avatar avatar-lg">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '1.2rem', overflowWrap: 'anywhere' }}>{fullName || me.email}</h2>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span className={`badge ${ROLE_BADGE[me.role]}`}>{ROLE_LABELS[me.role]}</span>
                    <span className={`badge ${STATUS_BADGE[me.status] || 'badge-inactive'}`}>
                      {statusLabel(me.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value cell-mono">{me.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Miembro desde</span>
                  <span className="detail-value">{fmtDate(me.created)}</span>
                </div>
                {details && typeof details.specialty === 'string' && (
                  <div className="detail-row">
                    <span className="detail-label">Especialidad</span>
                    <span className="detail-value">{details.specialty}</span>
                  </div>
                )}
                {details && typeof details.license_number === 'string' && (
                  <div className="detail-row">
                    <span className="detail-label">Licencia</span>
                    <span className="detail-value cell-mono">{details.license_number}</span>
                  </div>
                )}
                {details && typeof details.laboratory_zone === 'string' && details.laboratory_zone && (
                  <div className="detail-row">
                    <span className="detail-label">Zona de laboratorio</span>
                    <span className="detail-value">{details.laboratory_zone}</span>
                  </div>
                )}
                {details && typeof details.shift_hours === 'string' && details.shift_hours && (
                  <div className="detail-row">
                    <span className="detail-label">Turno</span>
                    <span className="detail-value">{details.shift_hours}</span>
                  </div>
                )}
                {details && typeof details.phone === 'string' && details.phone && (
                  <div className="detail-row">
                    <span className="detail-label">Teléfono</span>
                    <span className="detail-value cell-mono">{details.phone}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="card card-pad">
          <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock" size={16} /> Cambiar contraseña
          </div>
          <div className="chart-sub">Actualiza la contraseña de tu cuenta de acceso</div>

          {error && <div className="alert alert-err">{error}</div>}

          <form onSubmit={changePassword}>
            <div className="field">
              <label htmlFor="pw-current">Contraseña actual</label>
              <input
                id="pw-current"
                className="input"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="field">
              <label htmlFor="pw-new">Nueva contraseña</label>
              <input
                id="pw-new"
                className="input"
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                required
                autoComplete="new-password"
              />
              <PasswordStrength value={nueva} />
            </div>
            <div className="field">
              <label htmlFor="pw-confirm">Confirmar nueva contraseña</label>
              <input
                id="pw-confirm"
                className="input"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                autoComplete="new-password"
              />
              {confirmar && nueva !== confirmar && <span className="field-error">Las contraseñas no coinciden</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
