import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { resourcesForRole, canCreate, canUpdate, canDelete, TEST_STATUS_OPTIONS } from '../config/resources'
import { Icon } from '../components/Icon'
import { Donut, HBars, TrendChart } from '../components/Charts'
import { StatGridSkeleton, ChartSkeleton } from '../components/Skeleton'
import { useCountUp } from '../hooks/useCountUp'
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
    desc: 'Gestiona proyectos, muestras, protocolos y resultados de investigación. Puedes dar de alta asistentes con su cuenta de acceso.',
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

const DONUT_COLORS: Record<string, string> = {
  pending: 'var(--warning)',
  completed: 'var(--green)',
  rejected: 'var(--danger)',
}

interface ChartData {
  samples: ApiRecord[]
  results: ApiRecord[]
  projectsById: Record<string, ApiRecord>
}

function lastMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-PE', { month: 'short' }),
    })
  }
  return out
}

function bucketByMonth(rows: ApiRecord[], field: string, months: { key: string }[]): number[] {
  const counts = new Map<string, number>(months.map((m) => [m.key, 0]))
  rows.forEach((r) => {
    const v = r[field]
    if (!v) return
    const d = new Date(String(v))
    if (isNaN(d.getTime())) return
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1)
  })
  return months.map((m) => counts.get(m.key) ?? 0)
}

function AnimatedNumber({ value }: { value: number }) {
  const n = useCountUp(value)
  return <>{n.toLocaleString('es-PE')}</>
}

export default function Dashboard() {
  const { role, session } = useAuth()
  const resources = resourcesForRole(role)
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const [chart, setChart] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const intro = role ? ROLE_INTRO[role] : ROLE_INTRO.assistant

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const countCalls = Promise.all(
      resources.map((r) =>
        api
          .get<Paginated<ApiRecord> | ApiRecord[]>(`/${r.endpoint}/`, { params: { page_size: 1 } })
          .then((res): [string, number | null] => [
            r.key,
            Array.isArray(res.data) ? res.data.length : res.data.count,
          ])
          .catch((): [string, number | null] => [r.key, null])
      )
    )

    const big = { page_size: 200 }
    const chartCalls = Promise.all([
      api.get<Paginated<ApiRecord>>('/samples/', { params: big }),
      api.get<Paginated<ApiRecord>>('/sample-tests/', { params: big }),
      api.get<Paginated<ApiRecord>>('/projects/', { params: big }),
    ])

    Promise.all([countCalls, chartCalls])
      .then(([countEntries, [s, st, p]]) => {
        if (cancelled) return
        setCounts(Object.fromEntries(countEntries))
        const projectsById: Record<string, ApiRecord> = {}
        p.data.results.forEach((pr) => {
          projectsById[pr.id] = pr
        })
        setChart({ samples: s.data.results, results: st.data.results, projectsById })
      })
      .catch(() => {
        if (!cancelled) setChart({ samples: [], results: [], projectsById: {} })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const months = lastMonths(6)
  const donutData = TEST_STATUS_OPTIONS.map((o) => ({
    label: o.label,
    value: chart?.results.filter((r) => r.status === o.value).length ?? 0,
    color: DONUT_COLORS[o.value] ?? 'var(--blue)',
  }))

  const samplesByProject = (() => {
    if (!chart) return []
    const byProject = new Map<string, number>()
    chart.samples.forEach((s) => {
      const raw = s.projects
      const id = raw && typeof raw === 'object' ? String((raw as ApiRecord).id) : String(raw ?? '')
      if (id) byProject.set(id, (byProject.get(id) ?? 0) + 1)
    })
    return [...byProject.entries()]
      .map(([id, value]) => ({
        label: String(chart.projectsById[id]?.project_name ?? 'Proyecto eliminado'),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  })()

  const trendSeries = [
    { name: 'Muestras', color: 'var(--blue)', values: chart ? bucketByMonth(chart.samples, 'collection_date', months) : [] },
    { name: 'Resultados', color: 'var(--green)', values: chart ? bucketByMonth(chart.results, 'test_date', months) : [] },
  ]

  return (
    <div className="page-in">
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

      {loading ? (
        <>
          <StatGridSkeleton count={Math.min(resources.length, 4)} />
          <div className="chart-grid">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid stat-grid">
            {resources.map((r) => {
              const writable = canCreate(r, role) || canUpdate(r, role) || canDelete(r, role)
              return (
                <Link key={r.key} to={`/r/${r.key}`} className="card stat hoverable">
                  <Icon name={r.icon} className="stat-ico" size={30} />
                  <div className="stat-label">{r.label}</div>
                  <div className="stat-value">
                    {counts[r.key] == null ? '—' : <AnimatedNumber value={counts[r.key] as number} />}
                  </div>
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

          <div className="chart-grid">
            <div className="card chart-card">
              <div className="chart-title">Resultados por estado</div>
              <div className="chart-sub">Distribución de las pruebas registradas</div>
              <Donut data={donutData} centerLabel="Resultados" />
            </div>
            <div className="card chart-card">
              <div className="chart-title">Muestras por proyecto</div>
              <div className="chart-sub">Los {samplesByProject.length} proyectos con más muestras</div>
              <HBars data={samplesByProject} />
            </div>
            <div className="card chart-card">
              <div className="chart-title">Actividad del laboratorio</div>
              <div className="chart-sub">Muestras recolectadas y pruebas realizadas · últimos 6 meses</div>
              <TrendChart labels={months.map((m) => m.label)} series={trendSeries} />
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Acciones rápidas
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {resources
                .filter((r) => canCreate(r, role))
                .map((r) => (
                  <Link key={r.key} to={`/r/${r.key}?new=1`} className="btn">
                    <Icon name="plus" size={15} /> Nuevo {r.singular.toLowerCase()}
                  </Link>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
