import { Icon } from './Icon'
import { ROLE_OPTIONS, USER_STATUS_OPTIONS, TEST_STATUS_OPTIONS, type ColumnConfig, type ResourceConfig } from '../config/resources'
import type { ReferenceMap } from '../hooks/useReferenceData'
import type { ApiRecord } from '../types/models'

const STATUS_BADGE: Record<string, string> = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  suspended: 'badge-suspended',
  pending: 'badge-pending',
  in_progress: 'badge-blue',
  completed: 'badge-active',
}

const LABELS: Record<string, string> = Object.fromEntries(
  [...USER_STATUS_OPTIONS, ...TEST_STATUS_OPTIONS, { value: 'active', label: 'Activo' }].map((o) => [
    o.value,
    o.label,
  ])
)
const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label]))

function fmtDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(v as string)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: '2-digit' })
}

function resolveRef(value: unknown, col: ColumnConfig, refs: ReferenceMap): string {
  if (value == null) return '—'
  // FK anidado (objeto) o id plano.
  if (typeof value === 'object') return (col.optionLabel?.(value as ApiRecord)) || '—'
  const obj = refs[col.ref ?? '']?.byId?.[value as string]
  return obj && col.optionLabel ? col.optionLabel(obj) : '—'
}

function Cell({ row, col, refs }: { row: ApiRecord; col: ColumnConfig; refs: ReferenceMap }) {
  const value = row[col.key]

  switch (col.type) {
    case 'status': {
      const key = String(value ?? '')
      const cls = STATUS_BADGE[key] || 'badge-inactive'
      return <span className={`badge ${cls}`}>{LABELS[key] || key || '—'}</span>
    }
    case 'role': {
      const key = String(value ?? '')
      return <span className="badge badge-blue">{ROLE_LABELS[key] || key}</span>
    }
    case 'date':
      return <span className="cell-mono">{fmtDate(value)}</span>
    case 'money':
      return (
        <span className="cell-mono">
          {value != null && value !== ''
            ? `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
            : '—'}
        </span>
      )
    case 'mono':
      return <span className="cell-mono">{value == null || value === '' ? '—' : String(value)}</span>
    case 'ref':
      return <span>{resolveRef(value, col, refs)}</span>
    default:
      return <span>{value === '' || value == null ? '—' : String(value)}</span>
  }
}

interface DataTableProps {
  resource: ResourceConfig
  rows: ApiRecord[]
  refs: ReferenceMap
  canEdit: boolean
  canDelete: boolean
  onEdit: (row: ApiRecord) => void
  onDelete: (row: ApiRecord) => void
}

export function DataTable({ resource, rows, refs, canEdit, canDelete, onEdit, onDelete }: DataTableProps) {
  const showActions = canEdit || canDelete

  return (
    <div className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            {resource.columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {showActions && <th style={{ textAlign: 'right' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {resource.columns.map((c) => (
                <td key={c.key}>
                  <Cell row={row} col={c} refs={refs} />
                </td>
              ))}
              {showActions && (
                <td>
                  <div className="row-actions">
                    {canEdit && (
                      <button className="btn btn-sm btn-ghost" onClick={() => onEdit(row)} title="Editar">
                        <Icon name="edit" size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button className="btn btn-sm btn-danger" onClick={() => onDelete(row)} title="Eliminar">
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
