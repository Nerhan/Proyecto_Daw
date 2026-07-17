import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { Icon } from '../components/Icon'
import { SkeletonBlock, TableSkeleton } from '../components/Skeleton'
import { STATUS_BADGE, statusLabel } from '../utils/cells'
import { fmtDate, fmtMoney } from '../utils/format'
import type { ApiRecord, Paginated } from '../types/models'

interface DetailData {
  project: ApiRecord
  samples: ApiRecord[]
  results: ApiRecord[]
  assistantsById: Record<string, ApiRecord>
  testsById: Record<string, ApiRecord>
  assignedAssistantIds: string[]
}

function byId(rows: ApiRecord[]): Record<string, ApiRecord> {
  const out: Record<string, ApiRecord> = {}
  rows.forEach((r) => {
    out[r.id] = r
  })
  return out
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    const big = { page_size: 200 }
    Promise.all([
      api.get<ApiRecord>(`/projects/${id}/`),
      api.get<Paginated<ApiRecord>>('/samples/', { params: { ...big, projects: id } }),
      api.get<Paginated<ApiRecord>>('/assistant-projects/', { params: { ...big, projects: id } }),
      api.get<Paginated<ApiRecord>>('/sample-tests/', { params: big }),
      api.get<Paginated<ApiRecord>>('/assistants/', { params: big }),
      api.get<Paginated<ApiRecord>>('/tests/', { params: big }),
    ])
      .then(([p, s, ap, st, assistants, tests]) => {
        if (cancelled) return
        const samples = s.data.results
        const sampleIds = new Set(samples.map((r) => String(r.id)))
        setData({
          project: p.data,
          samples,
          results: st.data.results.filter((r) => sampleIds.has(String(r.samples))),
          assistantsById: byId(assistants.data.results),
          testsById: byId(tests.data.results),
          assignedAssistantIds: ap.data.results
            .filter((a) => a.status === 'active')
            .map((a) => String(a.assistants)),
        })
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('No se pudo cargar el proyecto.')
          navigate('/r/projects', { replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading || !data) {
    return (
      <div className="page-in">
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <SkeletonBlock w={110} h={10} />
          <SkeletonBlock w={280} h={26} style={{ marginTop: 12 }} />
          <SkeletonBlock w={200} h={12} style={{ marginTop: 12 }} />
        </div>
        <TableSkeleton cols={4} rows={4} />
      </div>
    )
  }

  const { project, samples, results, assistantsById, testsById, assignedAssistantIds } = data
  const scientist = (project.scientists ?? null) as ApiRecord | null
  const completed = results.filter((r) => r.status === 'completed').length
  const pct = results.length ? Math.round((completed / results.length) * 100) : 0
  const statusKey = String(project.status ?? '')
  const recentResults = [...results]
    .sort((a, b) => new Date(String(b.test_date)).getTime() - new Date(String(a.test_date)).getTime())
    .slice(0, 8)

  return (
    <div className="page-in">
      <button className="back-link" onClick={() => navigate('/r/projects')}>
        <Icon name="chevronLeft" size={15} /> Volver a proyectos
      </button>

      <div className="card card-pad" style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            right: -50,
            top: -50,
            width: 220,
            height: 220,
            background: 'radial-gradient(circle, rgba(0,230,160,0.14), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Proyecto de investigación
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 10 }}>{String(project.project_name)}</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <span className={`badge ${STATUS_BADGE[statusKey] || 'badge-inactive'}`}>{statusLabel(statusKey)}</span>
          {scientist && (
            <span className="cell-mono">
              Dr(a). {String(scientist.names)} {String(scientist.father_surname ?? '')} · {String(scientist.specialty ?? '')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.88rem' }}>
          <span>
            <span className="text-dim">Presupuesto: </span>
            <b className="mono">{fmtMoney(project.budget)}</b>
          </span>
          <span>
            <span className="text-dim">Financiamiento: </span>
            {String(project.funding_source ?? '—') || '—'}
          </span>
        </div>
        {typeof project.description === 'string' && project.description && (
          <p className="text-dim" style={{ marginTop: 12, maxWidth: 700, lineHeight: 1.6 }}>
            {project.description}
          </p>
        )}
      </div>

      <div className="tiles">
        <div className="card tile">
          <div className="tile-num">{samples.length}</div>
          <div className="tile-lab">Muestras</div>
        </div>
        <div className="card tile">
          <div className="tile-num">{assignedAssistantIds.length}</div>
          <div className="tile-lab">Asistentes asignados</div>
        </div>
        <div className="card tile">
          <div className="tile-num">{results.length}</div>
          <div className="tile-lab">Resultados</div>
        </div>
        <div className="card tile">
          <div className="tile-num" style={{ color: pct === 100 && results.length ? 'var(--green)' : undefined }}>
            {pct}%
          </div>
          <div className="tile-lab">Pruebas completadas</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card table-wrap">
          <div style={{ padding: '18px 20px 0' }}>
            <div className="chart-title">Muestras del proyecto</div>
            <div className="chart-sub">{samples.length} registradas</div>
          </div>
          {samples.length === 0 ? (
            <div className="empty" style={{ padding: '30px 20px' }}>
              Este proyecto aún no tiene muestras.
            </div>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Temp.</th>
                  <th>Recolección</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s) => {
                  const t = Number(s.storage_temperature)
                  const warn = !isNaN(t) && s.storage_temperature != null && t >= 3
                  return (
                    <tr key={s.id}>
                      <td data-label="Tipo">{String(s.sample_type)}</td>
                      <td data-label="Temp.">
                        <span className="temp-cell cell-mono">
                          {s.storage_temperature == null ? '—' : `${s.storage_temperature} °C`}
                          {warn && (
                            <span className="temp-warn" title="Cerca del límite de 4.0 °C">
                              <Icon name="alert" size={13} />
                            </span>
                          )}
                        </span>
                      </td>
                      <td data-label="Recolección">
                        <span className="cell-mono">{fmtDate(s.collection_date)}</span>
                      </td>
                      <td data-label="Estado">
                        <span className={`badge ${STATUS_BADGE[String(s.status)] || 'badge-inactive'}`}>
                          {statusLabel(String(s.status))}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <div className="chart-title">Equipo asignado</div>
            <div className="chart-sub">Asignaciones activas</div>
            {assignedAssistantIds.length === 0 && <div className="chart-empty">Sin asistentes asignados</div>}
            {assignedAssistantIds.map((aid) => {
              const a = assistantsById[aid]
              if (!a) return null
              const initials = `${String(a.names)[0] ?? ''}${String(a.father_surname ?? '')[0] ?? ''}`.toUpperCase()
              return (
                <div className="person-row" key={aid}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                      {String(a.names)} {String(a.father_surname ?? '')}
                    </div>
                    <div className="cell-mono" style={{ fontSize: '0.72rem' }}>
                      {String(a.laboratory_zone ?? '—')} · {String(a.shift_hours ?? '—')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card card-pad">
            <div className="chart-title">Resultados recientes</div>
            <div className="chart-sub">Últimas pruebas sobre muestras de este proyecto</div>
            {recentResults.length === 0 && <div className="chart-empty">Sin resultados todavía</div>}
            {recentResults.map((r) => (
              <div className="person-row" key={r.id}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {String(testsById[String(r.tests)]?.test_name ?? 'Protocolo')}
                  </div>
                  <div className="cell-mono" style={{ fontSize: '0.72rem' }}>
                    {fmtDate(r.test_date)}
                  </div>
                </div>
                <span className={`badge ${STATUS_BADGE[String(r.status)] || 'badge-inactive'}`}>
                  {statusLabel(String(r.status))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
