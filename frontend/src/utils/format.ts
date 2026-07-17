export function fmtDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: '2-digit' })
}

export function fmtDateTime(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtMoney(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return '—'
  return `S/. ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}
