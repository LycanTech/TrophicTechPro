"use client"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: string
  type: ToastType
  message: string
  description?: string
  leaving?: boolean
}

interface ToastCtx {
  success: (message: string, description?: string) => void
  error:   (message: string, description?: string) => void
  info:    (message: string, description?: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>")
  return ctx
}

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-[#30d158] flex-shrink-0" />,
  error:   <XCircle      className="w-4 h-4 text-[#ff453a] flex-shrink-0" />,
  info:    <Info         className="w-4 h-4 text-[#0a84ff] flex-shrink-0" />,
}

const BAR_COLOR = {
  success: "bg-[#30d158]",
  error:   "bg-[#ff453a]",
  info:    "bg-[#0a84ff]",
}

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  return (
    <div
      className="relative flex items-start gap-3 px-4 py-3 rounded-xl min-w-[300px] max-w-[380px] overflow-hidden"
      style={{
        background: "rgba(44,44,46,0.95)",
        border: "0.5px solid rgba(255,255,255,0.10)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        animation: toast.leaving
          ? "toast-leave 0.2s ease-in forwards"
          : "toast-enter 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${BAR_COLOR[toast.type]}`} />
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0 pt-px">
        <p className="text-sm font-medium text-white">{toast.message}</p>
        {toast.description && (
          <p className="text-xs text-[rgba(235,235,245,0.5)] mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-0.5 rounded text-[rgba(235,235,245,0.3)] hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
  }, [])

  const add = useCallback((type: ToastType, message: string, description?: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev.slice(-4), { id, type, message, description }])
    setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  const ctx: ToastCtx = {
    success: (m, d) => add("success", m, d),
    error:   (m, d) => add("error",   m, d),
    info:    (m, d) => add("info",    m, d),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
