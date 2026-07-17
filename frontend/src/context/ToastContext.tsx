import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'

type ToastKind = 'ok' | 'err' | 'info'

interface Toast {
  id: number
  message: string
  kind: ToastKind
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)
let idSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++idSeq
      setToasts((list) => [...list, { id, message, kind }])
      setTimeout(() => remove(id), 3800)
    },
    [remove]
  )

  const toast = useMemo<ToastApi>(
    () => ({
      success: (m) => push(m, 'ok'),
      error: (m) => push(m, 'err'),
      info: (m) => push(m, 'info'),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} onClick={() => remove(t.id)}>
            <Icon name={t.kind === 'ok' ? 'check' : t.kind === 'err' ? 'alert' : 'info'} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de un ToastProvider')
  return ctx
}
