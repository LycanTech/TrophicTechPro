"use client"
import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  width?: number
}

export function Drawer({ isOpen, onClose, title, subtitle, children, width = 480 }: DrawerProps) {
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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: isOpen ? "rgba(0,0,0,0.6)" : "transparent",
          backdropFilter: isOpen ? "blur(4px)" : "none",
          WebkitBackdropFilter: isOpen ? "blur(4px)" : "none",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: Math.min(width, window.innerWidth),
          background: "#1c1c1e",
          borderLeft: "0.5px solid rgba(255,255,255,0.08)",
          boxShadow: isOpen ? "-24px 0 80px rgba(0,0,0,0.6)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.25,0.1,0.25,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 flex-shrink-0"
             style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-[rgba(235,235,245,0.4)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg mt-0.5 text-[rgba(235,235,245,0.35)] hover:text-white hover:bg-white/[0.07] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>,
    document.body
  )
}
