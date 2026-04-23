'use client'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
  toasts: ToastItem[]
}

const ToastContext = createContext<ToastContextValue | null>(null)

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  const STYLES: Record<ToastType, string> = {
    success: 'bg-emerald-700 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white',
  }
  const ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl min-w-[220px] max-w-[340px] ${STYLES[t.type]}`}
        >
          <span className="text-base leading-none">{ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="opacity-70 hover:opacity-100 text-lg leading-none ml-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
