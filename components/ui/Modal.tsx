"use client"
import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: number
}

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 520 }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  if (typeof window === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: isOpen ? 1 : 0,
        }}
      />

      {/* Dialog */}
      <div
        className="relative w-full rounded-2xl flex flex-col max-h-[85dvh]"
        style={{
          maxWidth,
          background: "#1c1c1e",
          border: "0.5px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.72), 0 0 0 0.5px rgba(255,255,255,0.06)",
          animation: isOpen ? "scale-in 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
          opacity: isOpen ? undefined : 0,
          transform: isOpen ? undefined : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 flex-shrink-0"
             style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-[17px] font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-[rgba(235,235,245,0.45)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[rgba(235,235,245,0.35)] hover:text-white hover:bg-white/[0.07] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>,
    document.body
  )
}
