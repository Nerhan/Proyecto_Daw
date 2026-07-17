import { Icon } from './Icon'
import type { ColumnConfig, ResourceConfig } from '../config/resources'
import type { ReferenceMap } from '../hooks/useReferenceData'
import type { ApiRecord } from '../types/models'
import { STATUS_BADGE, ROLE_LABELS, statusLabel, resolveRefText } from '../utils/cells'
import { fmtDate, fmtMoney } from '../utils/format'

export interface SortState {
  field: string
  dir: 'asc' | 'desc'
}

function Cell({ row, col, refs }: { row: ApiRecord; col: ColumnConfig; refs: ReferenceMap }) {
  const value = row[col.key]

  switch (col.type) {
    case 'status': {
      const key = String(value ?? '')
      const cls = STATUS_BADGE[key] || 'badge-inactive'
      return <span className={`badge ${cls}`}>{statusLabel(key)}</span>
    }
    case 'role': {
      const key = String(value ?? '')
      return <span className="badge badge-blue">{ROLE_LABELS[key] || key}</span>
    }
    case 'date':
      return <span className="cell-mono">{fmtDate(value)}</span>
    case 'money':
      return <span className="cell-mono">{fmtMoney(value)}</span>
    case 'temp': {
      if (value == null || value === '') return <span className="cell-mono">—</span>
      const t = Number(value)
      const warn = !isNaN(t) && t >= 3
      return (
        <span className="temp-cell cell-mono">
          {String(value)} °C
          {warn && (
            <span className="temp-warn" title="Cerca del límite de 4.0 °C">
              <Icon name="alert" size={13} />
            </span>
          )}
        </span>
      )
    }
    case 'mono':
      return <span className="cell-mono">{value == null || value === '' ? '—' : String(value)}</span>
    case 'ref':
      return <span>{resolveRefText(value, col, refs)}</span>
    default:
      return <span>{value === '' || value == null ? '—' : String(value)}</span>
  }
}

interface DataTableProps {
  resource: ResourceConfig
  rows: ApiRecord[]
  refs: ReferenceMap
  sort: SortState | null
  onSort: (field: string) => void
  canEdit: boolean
  canDelete: boolean
  onOpen: (row: ApiRecord) => void
  onView?: (row: ApiRecord) => void
  onEdit: (row: ApiRecord) => void
  onDelete: (row: ApiRecord) => void
}

export function DataTable({
  resource,
  rows,
  refs,
  sort,
  onSort,
  canEdit,
  canDelete,
  onOpen,
  onView,
  onEdit,
  onDelete,
}: DataTableProps) {
  return (
    <div className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            {resource.columns.map((c) => {
              const sortable = c.sortable !== false && c.type !== 'ref'
              const isSorted = sort?.field === c.key
              const ariaSort = isSorted ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined
              return (
                <th
                  key={c.key}
                  className={sortable ? 'sortable' : undefined}
                  aria-sort={ariaSort}
                  onClick={sortable ? () => onSort(c.key) : undefined}
                >
                  {c.label}
                  {sortable && (
                    <span className="sort-ind">
                      <Icon name="arrowUp" size={12} />
                    </span>
                  )}
                </th>
              )
            })}
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className="row-clickable"
              style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}
              onClick={() => onOpen(row)}
            >
              {resource.columns.map((c) => (
                <td key={c.key} data-label={c.label}>
                  <Cell row={row} col={c} refs={refs} />
                </td>
              ))}
              <td data-label="Acciones">
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-sm btn-ghost" onClick={() => onOpen(row)} title="Ver detalle">
                    <Icon name="eye" size={15} />
                  </button>
                  {onView && (
                    <button className="btn btn-sm btn-ghost" onClick={() => onView(row)} title="Abrir proyecto">
                      <Icon name="project" size={15} />
                    </button>
                  )}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
