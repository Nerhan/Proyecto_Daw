import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon'

export interface PaletteItem {
  id: string
  label: string
  hint: string
  icon: IconName
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  items: PaletteItem[]
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  if (!open) return null

  const q = normalize(query.trim())
  const filtered = q ? items.filter((it) => normalize(it.label).includes(q)) : items
  const active = Math.min(index, Math.max(0, filtered.length - 1))

  const run = (item: PaletteItem) => {
    onClose()
    item.run()
  }

  return (
    <div className="palette-overlay" onMouseDown={onClose}>
      <div className="palette card" role="dialog" aria-modal="true" aria-label="Paleta de comandos" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIndex((i) => Math.min(i + 1, filtered.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIndex((i) => Math.max(i - 1, 0))
              }
              if (e.key === 'Enter' && filtered[active]) run(filtered[active])
            }}
            placeholder="Buscar sección o acción…"
            aria-label="Buscar comando"
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="palette-list" role="listbox">
          {filtered.map((it, i) => (
            <button
              key={it.id}
              className={`palette-item ${i === active ? 'active' : ''}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setIndex(i)}
              onClick={() => run(it)}
            >
              <Icon name={it.icon} size={16} />
              {it.label}
              <span className="palette-hint">{it.hint}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="palette-empty">Sin resultados para «{query}»</div>}
        </div>
      </div>
    </div>
  )
}
