import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react'

const ToastContext = createContext(null)

const TYPE_STYLES = {
  success: {
    icon: CheckCircle2,
    ring: 'border-green-200',
    bg: 'bg-white',
    accent: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  error: {
    icon: AlertCircle,
    ring: 'border-red-200',
    bg: 'bg-white',
    accent: 'text-red-600',
    iconBg: 'bg-red-50',
  },
  info: {
    icon: Info,
    ring: 'border-brand-200',
    bg: 'bg-white',
    accent: 'text-brand-700',
    iconBg: 'bg-brand-50',
  },
  loading: {
    icon: Loader2,
    ring: 'border-gray-200',
    bg: 'bg-white',
    accent: 'text-gray-600',
    iconBg: 'bg-gray-50',
  },
}

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ type = 'info', title, message, duration = 3500 }) => {
      const id = nextId++
      setToasts((list) => [...list, { id, type, title, message }])
      if (type !== 'loading') {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const success = useCallback(
    (title, message) => toast({ type: 'success', title, message }),
    [toast]
  )
  const error = useCallback(
    (title, message) => toast({ type: 'error', title, message }),
    [toast]
  )
  const info = useCallback(
    (title, message) => toast({ type: 'info', title, message }),
    [toast]
  )
  const loading = useCallback(
    (title, message) => toast({ type: 'loading', title, message, duration: 0 }),
    [toast]
  )

  const value = { toast, success, error, info, loading, dismiss }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] max-w-sm"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const style = TYPE_STYLES[t.type] || TYPE_STYLES.info
          const Icon = style.icon
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${style.ring} ${style.bg} shadow-lg px-4 py-3 animate-fade-in-up`}
            >
              <div
                className={`w-9 h-9 rounded-lg ${style.iconBg} ${style.accent} flex items-center justify-center shrink-0`}
              >
                <Icon
                  size={16}
                  className={t.type === 'loading' ? 'animate-spin' : ''}
                />
              </div>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="text-sm font-semibold text-gray-900">
                    {t.title}
                  </p>
                )}
                {t.message && (
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-400 hover:text-gray-700 shrink-0"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}