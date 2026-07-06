import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export interface ToastData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// Simple global toast store
let toasts: ToastData[] = []
let listeners: (() => void)[] = []

function notifyListeners() {
  listeners.forEach((l) => l())
}

export function showToast(toast: Omit<ToastData, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts.slice(-2), { ...toast, id }]
  notifyListeners()

  const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3000)
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  }, duration)
}

function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notifyListeners()
}

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-success' },
  error: { icon: XCircle, color: 'text-error' },
  warning: { icon: AlertTriangle, color: 'text-warning' },
  info: { icon: Info, color: 'text-primary' }
}

function Toast({ toast }: { toast: ToastData }) {
  const config = typeConfig[toast.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="w-80 bg-surface-elevated border border-border rounded-md p-md flex items-start gap-sm shadow-raised focus-visible:outline-none"
    >
      <Icon size={18} className={`${config.color} flex-shrink-0 mt-px`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary font-sans">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-secondary mt-xs font-sans">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        className="text-text-secondary hover:text-text-primary hover:bg-surface-card-hover p-1 rounded-full transition-all duration-[160ms] ease-standard focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none flex-shrink-0"
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function ToastContainer(): JSX.Element {
  const [, forceRender] = useState(0)

  const rerender = useCallback(() => {
    forceRender((c) => c + 1)
  }, [])

  useEffect(() => {
    listeners.push(rerender)
    return () => {
      listeners = listeners.filter((l) => l !== rerender)
    }
  }, [rerender])

  return (
    <div className="fixed bottom-lg right-lg z-50 flex flex-col gap-sm" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
