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
  success: { icon: CheckCircle, color: 'text-success', border: 'border-success/30' },
  error: { icon: XCircle, color: 'text-error', border: 'border-error/30' },
  warning: { icon: AlertTriangle, color: 'text-warning', border: 'border-warning/30' },
  info: { icon: Info, color: 'text-primary', border: 'border-primary/30' }
}

function Toast({ toast }: { toast: ToastData }) {
  const config = typeConfig[toast.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      className={`w-80 glass glass-border rounded-md p-md flex items-start gap-sm border ${config.border}`}
    >
      <Icon size={18} className={`${config.color} flex-shrink-0 mt-px`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-secondary mt-xs">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
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
    <div className="fixed bottom-lg right-lg z-50 flex flex-col gap-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
