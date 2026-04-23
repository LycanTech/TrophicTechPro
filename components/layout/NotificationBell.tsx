"use client"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Bell } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import type { DeploymentRow } from "@/types"

const STATUS_DOT: Record<string, string> = {
  success:   "bg-[#30d158]",
  failed:    "bg-[#ff453a]",
  running:   "bg-[#0a84ff] animate-pulse",
  pending:   "bg-[#ff9f0a]",
  cancelled: "bg-[rgba(235,235,245,0.3)]",
}

interface Props {
  notifications: DeploymentRow[]
}

export function NotificationBell({ notifications }: Props) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const hasUnseen = !seen && notifications.some(n => n.status === "running" || n.status === "failed")

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(o => !o)
    setSeen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="relative p-1.5 rounded-lg text-[rgba(235,235,245,0.4)] hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {hasUnseen && (
          <span
            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#ff453a]"
            style={{ boxShadow: "0 0 0 1.5px #000" }}
          />
        )}
      </button>

      {mounted && open && createPortal(
        <div style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 200 }}>
          <div
            className="w-[300px] rounded-xl overflow-hidden"
            style={{
              background: "#1c1c1e",
              border: "0.5px solid rgba(255,255,255,0.10)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.64), 0 0 0 0.5px rgba(255,255,255,0.06)",
              animation: "scale-in 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards",
              transformOrigin: "top right",
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[13px] font-semibold text-white">Recent Activity</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[rgba(235,235,245,0.3)]">All quiet</p>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}
                >
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[n.status] ?? STATUS_DOT.cancelled}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-white truncate">{n.project.name}</p>
                    <p className="text-xs text-[rgba(235,235,245,0.4)] mt-0.5 truncate">
                      {n.version} · {n.environment} · {formatRelativeTime(new Date(n.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
