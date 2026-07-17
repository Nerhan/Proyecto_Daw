import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api, { apiErrorMessage } from '../api/client'
import { RESOURCE_BY_KEY, canCreate, canUpdate, canDelete, type ResourceConfig } from '../config/resources'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useReferenceData } from '../hooks/useReferenceData'
import { useDebounce } from '../hooks/useDebounce'
import { DataTable, type SortState } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { Drawer } from '../components/Drawer'
import { RecordDetail } from '../components/RecordDetail'
import { ResourceForm } from '../components/ResourceForm'
import { Kanban } from '../components/Kanban'
import { TableSkeleton } from '../components/Skeleton'
import { Icon } from '../components/Icon'
import { cellText } from '../utils/cells'
import { downloadCsv } from '../utils/csv'
import type { ApiRecord, Paginated } from '../types/models'

interface ModalState {
  record: ApiRecord | null
}

function defaultFilters(resource?: ResourceConfig): Record<string, string> {
  const out: Record<string, string> = {}
  resource?.filters?.forEach((f) => {
    out[f.name] = f.default ?? ''
  })
  return out
}

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const wanted = [1, 2, current - 1, current, current + 1, total - 1, total].filter((n) => n >= 1 && n <= total)
  const arr = [...new Set(wanted)].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  arr.forEach((n, i) => {
    if (i > 0 && n - arr[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

export default function ResourcePage() {
  const { key } = useParams<{ key: string }>()
  const resource = key ? RESOURCE_BY_KEY[key] : undefined
  const { role } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [rows, setRows] = useState<ApiRecord[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const query = useDebounce(searchInput.trim(), 400)
  const [filters, setFilters] = useState<Record<string, string>>(() => defaultFilters(resource))
  const [ordering, setOrdering] = useState('')
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState<ModalState | null>(null)
  const [drawer, setDrawer] = useState<ApiRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirm, setConfirm] = useState<ApiRecord | null>(null)

  const { refs } = useReferenceData(resource)
  const allowCreate = !!resource && canCreate(resource, role)
  const allowUpdate = !!resource && canUpdate(resource, role)
  const allowDelete = !!resource && canDelete(resource, role)

  useEffect(() => {
    setPage(1)
  }, [query, filters, ordering, pageSize, view])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      if (resource && canCreate(resource, role)) setModal({ record: null })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, resource, role, setSearchParams])

  const buildParams = useCallback(
    (forExport = false): Record<string, string | number> => {
      const params: Record<string, string | number> = {}
      if (view === 'kanban' || forExport) {
        params.page_size = 200
      } else {
        params.page = page
        params.page_size = pageSize
      }
      if (query) params.search = query
      if (ordering) params.ordering = ordering
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v
      })
      return params
    },
    [view, page, pageSize, query, ordering, filters]
  )

  const load = useCallback(async () => {
    if (!resource) return
    setLoading(true)
    try {
      const { data } = await api.get<Paginated<ApiRecord> | ApiRecord[]>(`/${resource.endpoint}/`, {
        params: buildParams(),
      })
      if (Array.isArray(data)) {
        setRows(data)
        setCount(data.length)
      } else {
        setRows(data.results)
        setCount(data.count)
      }
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo cargar la lista.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [resource, buildParams, toast])

  useEffect(() => {
    load()
  }, [load])

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
  }

  const onSort = (field: string) => {
    setOrdering((o) => (o === field ? `-${field}` : o === `-${field}` ? '' : field))
  }

  const sort: SortState | null = ordering
    ? ordering.startsWith('-')
      ? { field: ordering.slice(1), dir: 'desc' }
      : { field: ordering, dir: 'asc' }
    : null

  const save = async (payload: Record<string, unknown>) => {
    if (!resource || !modal) return
    setSubmitting(true)
    try {
      if (modal.record) {
        await api.put(`/${resource.endpoint}/${modal.record.id}/`, payload)
        toast.success(`${resource.singular} actualizado.`)
      } else {
        await api.post(`/${resource.endpoint}/`, payload)
        toast.success(`${resource.singular} creado.`)
      }
      setModal(null)
      load()
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo guardar.'))
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    if (!resource || !confirm) return
    try {
      await api.delete(`/${resource.endpoint}/${confirm.id}/`)
      toast.success(`${resource.singular} eliminado.`)
      setConfirm(null)
      setDrawer(null)
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo eliminar.'))
      setConfirm(null)
    }
  }

  const changeStatus = async (row: ApiRecord, status: string) => {
    if (!resource) return
    const prevRows = rows
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)))
    try {
      await api.patch(`/${resource.endpoint}/${row.id}/`, { status })
      toast.success('Estado actualizado.')
    } catch (e) {
      setRows(prevRows)
      toast.error(apiErrorMessage(e, 'No se pudo actualizar el estado.'))
    }
  }

  const exportCsv = async () => {
    if (!resource) return
    try {
      const { data } = await api.get<Paginated<ApiRecord> | ApiRecord[]>(`/${resource.endpoint}/`, {
        params: buildParams(true),
      })
      const items = Array.isArray(data) ? data : data.results
      const headers = resource.columns.map((c) => c.label)
      const body = items.map((r) => resource.columns.map((c) => cellText(r, c, refs)))
      downloadCsv(`${resource.key}-${new Date().toISOString().slice(0, 10)}.csv`, headers, body)
      toast.success(`${items.length} registros exportados a CSV.`)
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo exportar.'))
    }
  }

  if (!resource) {
    return <div className="empty">Recurso no encontrado.</div>
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const readOnly = !allowCreate && !allowUpdate && !allowDelete

  return (
    <div className="page-in">
      <div className="page-head">
        <div>
          <div className="eyebrow">{resource.group}</div>
          <h2>{resource.label}</h2>
          <p>
            {count} registro{count === 1 ? '' : 's'}
            {readOnly && (
              <>
                {'  ·  '}
                <span className="readonly-note">
                  <Icon name="lock" size={13} /> Solo lectura para tu rol
                </span>
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={exportCsv} title="Exportar los registros filtrados a CSV">
            <Icon name="download" size={16} /> Exportar CSV
          </button>
          {allowCreate && (
            <button className="btn btn-primary" onClick={() => setModal({ record: null })}>
              <Icon name="plus" size={16} /> Nuevo {resource.singular.toLowerCase()}
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        {resource.search && (
          <form className="search" onSubmit={submitSearch}>
            <Icon name="search" />
            <input
              className="input"
              placeholder={`Buscar ${resource.label.toLowerCase()}…`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Buscar"
            />
          </form>
        )}
        {resource.filters?.map((f) => (
          <select
            key={f.name}
            className="select filter-select"
            value={filters[f.name] ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, [f.name]: e.target.value }))}
            aria-label={f.label}
          >
            <option value="">{f.allLabel}</option>
            {(f.ref
              ? (refs[f.ref]?.items || []).map((o) => ({
                  value: String(o.id),
                  label: f.optionLabel ? f.optionLabel(o) : String(o.id),
                }))
              : f.options ?? []
            ).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {resource.kanban && (
          <div className="seg" style={{ marginLeft: 'auto' }} role="group" aria-label="Modo de vista">
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>
              <Icon name="results" size={14} /> Tabla
            </button>
            <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>
              <Icon name="board" size={14} /> Tablero
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <TableSkeleton cols={resource.columns.length + 1} />
      ) : rows.length === 0 ? (
        <div className="card empty">
          <Icon name={resource.icon} size={48} />
          <p>No hay registros{query ? ' para tu búsqueda' : ' con los filtros actuales'}.</p>
          {allowCreate && !query && (
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setModal({ record: null })}>
              <Icon name="plus" size={16} /> Crear el primero
            </button>
          )}
        </div>
      ) : view === 'kanban' ? (
        <Kanban rows={rows} refs={refs} canUpdate={allowUpdate} onOpen={setDrawer} onStatusChange={changeStatus} />
      ) : (
        <>
          <DataTable
            resource={resource}
            rows={rows}
            refs={refs}
            sort={sort}
            onSort={onSort}
            canEdit={allowUpdate}
            canDelete={allowDelete}
            onOpen={setDrawer}
            onView={resource.detail ? (row) => navigate(`/projects/${row.id}`) : undefined}
            onEdit={(row) => setModal({ record: row })}
            onDelete={setConfirm}
          />
          <div className="pagination">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono">
                Página {page} de {totalPages}
              </span>
              <select
                className="select filter-select"
                style={{ minWidth: 0, padding: '5px 8px' }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Registros por página"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / pág.
                  </option>
                ))}
              </select>
            </div>
            <div className="pagination-btns">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <Icon name="chevronLeft" size={15} />
              </button>
              {pageList(page, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} className="page-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`page-num ${p === page ? 'current' : ''}`}
                    onClick={() => setPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <Icon name="chevronRight" size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      {drawer && (
        <Drawer
          title={resource.singular}
          onClose={() => setDrawer(null)}
          footer={
            <>
              {resource.detail && (
                <button className="btn" onClick={() => navigate(`/projects/${drawer.id}`)}>
                  <Icon name="project" size={15} /> Ver proyecto completo
                </button>
              )}
              {allowUpdate && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setModal({ record: drawer })
                    setDrawer(null)
                  }}
                >
                  <Icon name="edit" size={15} /> Editar
                </button>
              )}
              {allowDelete && (
                <button className="btn btn-danger" onClick={() => setConfirm(drawer)}>
                  <Icon name="trash" size={15} /> Eliminar
                </button>
              )}
            </>
          }
        >
          <RecordDetail resource={resource} record={drawer} refs={refs} role={role} />
        </Drawer>
      )}

      {modal && (
        <Modal
          title={modal.record ? `Editar ${resource.singular.toLowerCase()}` : `Nuevo ${resource.singular.toLowerCase()}`}
          onClose={() => setModal(null)}
        >
          <ResourceForm
            resource={resource}
            record={modal.record}
            refs={refs}
            actingRole={role}
            submitting={submitting}
            onSubmit={save}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {confirm && (
        <Modal
          title="Confirmar eliminación"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={remove}>
                <Icon name="trash" size={15} /> Eliminar
              </button>
            </>
          }
        >
          <p style={{ lineHeight: 1.6 }}>
            ¿Seguro que deseas eliminar este {resource.singular.toLowerCase()}? Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  )
}
