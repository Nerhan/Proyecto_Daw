import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const prev = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]')).filter(
        (el) => !el.hasAttribute('disabled')
      )
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const list = focusables()
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener('keydown', trap)
    return () => {
      panel.removeEventListener('keydown', trap)
      prev?.focus()
    }
  }, [])

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
