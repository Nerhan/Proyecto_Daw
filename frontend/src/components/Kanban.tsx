import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { TEST_STATUS_OPTIONS } from '../config/resources'
import type { ApiRecord } from '../types/models'
import type { ReferenceMap } from '../hooks/useReferenceData'
import { resolveRefText, STATUS_BADGE } from '../utils/cells'
import { fmtDate } from '../utils/format'

interface KanbanProps {
  rows: ApiRecord[]
  refs: ReferenceMap
  canUpdate: boolean
  onOpen: (row: ApiRecord) => void
  onStatusChange: (row: ApiRecord, status: string) => void
}

const sampleCol = { ref: 'samples', optionLabel: (o: ApiRecord) => String(o.sample_type) }
const testCol = { ref: 'tests', optionLabel: (o: ApiRecord) => String(o.test_name) }
const assistantCol = {
  ref: 'assistants',
  optionLabel: (o: ApiRecord) => `${o.names} ${o.father_surname ?? ''}`.trim(),
}

interface DragState {
  id: string
  row: ApiRecord
  startX: number
  startY: number
  moved: boolean
  label: string
}

export function Kanban({ rows, refs, canUpdate, onOpen, onStatusChange }: KanbanProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number; label: string } | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const columnAt = (x: number, y: number): string | null => {
    for (const col of TEST_STATUS_OPTIONS) {
      const el = colRefs.current[col.value]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return col.value
    }
    return null
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>, row: ApiRecord) => {
    if (!canUpdate || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: String(row.id),
      row,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      label: resolveRefText(row.samples, sampleCol, refs),
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = dragRef.current
    if (!st) return
    if (!st.moved) {
      if (Math.hypot(e.clientX - st.startX, e.clientY - st.startY) < 6) return
      st.moved = true
      setDragId(st.id)
    }
    setGhost({ x: e.clientX, y: e.clientY, label: st.label })
    setOverCol(columnAt(e.clientX, e.clientY))
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = dragRef.current
    dragRef.current = null
    setDragId(null)
    setGhost(null)
    setOverCol(null)
    if (!st) return
    if (!st.moved) {
      onOpen(st.row)
      return
    }
    const target = columnAt(e.clientX, e.clientY)
    if (target && st.row.status !== target) onStatusChange(st.row, target)
  }

  const handlePointerCancel = () => {
    dragRef.current = null
    setDragId(null)
    setGhost(null)
    setOverCol(null)
  }

  return (
    <div className="kanban">
      {TEST_STATUS_OPTIONS.map((col) => {
        const items = rows.filter((r) => r.status === col.value)
        const isOver = !!dragId && overCol === col.value
        return (
          <div
            key={col.value}
            ref={(el) => {
              colRefs.current[col.value] = el
            }}
            className={`kan-col ${isOver ? 'over' : ''}`}
          >
            <div className="kan-head">
              <span className={`badge ${STATUS_BADGE[col.value] || 'badge-inactive'}`}>{col.label}</span>
              <span className="kan-count">{items.length}</span>
            </div>
            {items.map((r) => (
              <div
                key={r.id}
                className={`kan-card ${dragId === String(r.id) ? 'dragging' : ''}`}
                style={canUpdate ? { touchAction: 'none' } : undefined}
                onPointerDown={(e) => handlePointerDown(e, r)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onOpen(r)}
              >
                <div className="kan-title">{resolveRefText(r.samples, sampleCol, refs)}</div>
                <div className="kan-meta">
                  <span>{resolveRefText(r.tests, testCol, refs)}</span>
                  <span>
                    {resolveRefText(r.assistants, assistantCol, refs)} · {fmtDate(r.test_date)}
                  </span>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="chart-empty">{dragId ? 'Suelta aquí' : 'Sin registros'}</div>
            )}
          </div>
        )
      })}
      {ghost && (
        <div className="kan-ghost" style={{ left: ghost.x, top: ghost.y }}>
          {ghost.label}
        </div>
      )}
    </div>
  )
}
