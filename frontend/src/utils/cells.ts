import type { ApiRecord } from '../types/models'
import type { ColumnConfig } from '../config/resources'
import type { ReferenceMap } from '../hooks/useReferenceData'
import { ROLE_OPTIONS, USER_STATUS_OPTIONS, TEST_STATUS_OPTIONS } from '../config/resources'
import { fmtDate, fmtMoney } from './format'

export const STATUS_BADGE: Record<string, string> = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  suspended: 'badge-suspended',
  pending: 'badge-pending',
  completed: 'badge-active',
  rejected: 'badge-danger',
}

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  [...USER_STATUS_OPTIONS, ...TEST_STATUS_OPTIONS].map((o) => [o.value, o.label])
)

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((o) => [o.value, o.label])
)

export function statusLabel(v: string): string {
  return STATUS_LABELS[v] || v || '—'
}

interface RefLike {
  ref?: string
  optionLabel?: (obj: ApiRecord) => string
}

export function resolveRefText(value: unknown, col: RefLike, refs: ReferenceMap): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'object') {
    return col.optionLabel?.(value as ApiRecord) || '—'
  }
  const obj = refs[col.ref ?? '']?.byId?.[String(value)]
  return obj && col.optionLabel ? col.optionLabel(obj) : '—'
}

export function cellText(row: ApiRecord, col: ColumnConfig, refs: ReferenceMap): string {
  const value = row[col.key]
  switch (col.type) {
    case 'status':
      return statusLabel(String(value ?? ''))
    case 'role':
      return ROLE_LABELS[String(value)] || String(value ?? '—')
    case 'date':
      return fmtDate(value)
    case 'money':
      return fmtMoney(value)
    case 'temp':
      return value == null || value === '' ? '—' : `${value} °C`
    case 'ref':
      return resolveRefText(value, col, refs)
    default:
      return value == null || value === '' ? '—' : String(value)
  }
}
