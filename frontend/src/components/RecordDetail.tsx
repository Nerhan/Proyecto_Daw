import type { ReactNode } from 'react'
import { resolveOptions, type FieldConfig, type ResourceConfig } from '../config/resources'
import type { ApiRecord, Role } from '../types/models'
import type { ReferenceMap } from '../hooks/useReferenceData'
import { resolveRefText, statusLabel, STATUS_BADGE } from '../utils/cells'
import { fmtDateTime, fmtMoney } from '../utils/format'

function fieldValue(f: FieldConfig, record: ApiRecord, refs: ReferenceMap, role: Role | undefined): ReactNode {
  const raw = record[f.sourceKey ?? f.name]
  if (f.type === 'ref') return resolveRefText(raw, f, refs)
  if (f.type === 'select') {
    const v = String(raw ?? '')
    if (f.name === 'status') {
      const cls = STATUS_BADGE[v] || 'badge-inactive'
      return <span className={`badge ${cls}`}>{statusLabel(v)}</span>
    }
    const opt = resolveOptions(f, role).find((o) => o.value === v)
    return opt?.label ?? (v || '—')
  }
  if (f.name === 'budget') return fmtMoney(raw)
  if (raw == null || raw === '') return '—'
  if (f.name === 'storage_temperature') return `${raw} °C`
  return String(raw)
}

interface RecordDetailProps {
  resource: ResourceConfig
  record: ApiRecord
  refs: ReferenceMap
  role: Role | undefined
}

export function RecordDetail({ resource, record, refs, role }: RecordDetailProps) {
  return (
    <div className="detail-list">
      {resource.fields
        .filter((f) => f.type !== 'password')
        .map((f) => (
          <div className="detail-row" key={f.name}>
            <span className="detail-label">{f.label}</span>
            <span className="detail-value">{fieldValue(f, record, refs, role)}</span>
          </div>
        ))}
      <div className="detail-row">
        <span className="detail-label">Creado</span>
        <span className="detail-value">
          {fmtDateTime(record.created)}
          {record.created_by ? <span className="text-dim"> · {String(record.created_by)}</span> : null}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Modificado</span>
        <span className="detail-value">
          {fmtDateTime(record.modified)}
          {record.modified_by ? <span className="text-dim"> · {String(record.modified_by)}</span> : null}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">ID</span>
        <span className="detail-value cell-mono">{record.id}</span>
      </div>
    </div>
  )
}
