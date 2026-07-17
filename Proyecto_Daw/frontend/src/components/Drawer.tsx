import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface DrawerProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Drawer({ title, onClose, children, footer }: DrawerProps) {
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
    focusables()[0]?.focus()
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
    <>
      <div className="drawer-overlay" onMouseDown={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={title} ref={panelRef}>
        <div className="drawer-head">
          <h3>{title}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  )
}
