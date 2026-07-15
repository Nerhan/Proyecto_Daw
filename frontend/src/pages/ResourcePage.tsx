import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import api, { apiErrorMessage } from '../api/client'
import { RESOURCE_BY_KEY, canCreate, canUpdate, canDelete } from '../config/resources'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useReferenceData } from '../hooks/useReferenceData'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { ResourceForm } from '../components/ResourceForm'
import { Icon } from '../components/Icon'
import type { ApiRecord, Paginated } from '../types/models'

interface ModalState {
  record: ApiRecord | null
}

export default function ResourcePage() {
  const { key } = useParams<{ key: string }>()
  const resource = key ? RESOURCE_BY_KEY[key] : undefined
  const { role } = useAuth()
  const toast = useToast()

  const [rows, setRows] = useState<ApiRecord[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState<ModalState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirm, setConfirm] = useState<ApiRecord | null>(null)

  const { refs } = useReferenceData(resource)
  const allowCreate = !!resource && canCreate(resource, role)
  const allowUpdate = !!resource && canUpdate(resource, role)
  const allowDelete = !!resource && canDelete(resource, role)
  const pageSize = 20

  const load = useCallback(async () => {
    if (!resource) return
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page }
      if (query) params.search = query
      const { data } = await api.get<Paginated<ApiRecord> | ApiRecord[]>(`/${resource.endpoint}/`, { params })
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
  }, [resource, page, query, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
    setSearch('')
    setQuery('')
  }, [key])

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

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
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo eliminar.'))
      setConfirm(null)
    }
  }

  if (!resource) {
    return <div className="empty">Recurso no encontrado.</div>
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const readOnly = !allowCreate && !allowUpdate && !allowDelete

  return (
    <div>
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
        {allowCreate && (
          <button className="btn btn-primary" onClick={() => setModal({ record: null })}>
            <Icon name="plus" size={16} /> Nuevo {resource.singular.toLowerCase()}
          </button>
        )}
      </div>

      {resource.search && (
        <div className="toolbar">
          <form className="search" onSubmit={submitSearch}>
            <Icon name="search" />
            <input
              className="input"
              placeholder={`Buscar ${resource.label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          {query && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('')
                setQuery('')
                setPage(1)
              }}
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : rows.length === 0 ? (
        <div className="card empty">
          <Icon name={resource.icon} size={48} />
          <p>No hay registros{query ? ' para tu búsqueda' : ' todavía'}.</p>
          {allowCreate && !query && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 14 }}
              onClick={() => setModal({ record: null })}
            >
              <Icon name="plus" size={16} /> Crear el primero
            </button>
          )}
        </div>
      ) : (
        <>
          <DataTable
            resource={resource}
            rows={rows}
            refs={refs}
            canEdit={allowUpdate}
            canDelete={allowDelete}
            onEdit={(row) => setModal({ record: row })}
            onDelete={(row) => setConfirm(row)}
          />
          <div className="pagination">
            <span className="mono">
              Página {page} de {totalPages}
            </span>
            <div className="pagination-btns">
              <button
                className="btn btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Icon name="chevronLeft" size={15} /> Anterior
              </button>
              <button
                className="btn btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente <Icon name="chevronRight" size={15} />
              </button>
            </div>
          </div>
        </>
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
            ¿Seguro que deseas eliminar este {resource.singular.toLowerCase()}? Esta acción no se
            puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  )
}
