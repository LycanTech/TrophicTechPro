"use client"
import { Search } from "lucide-react"
import { NotificationBell } from "@/components/layout/NotificationBell"
import type { DeploymentRow } from "@/types"

interface Props {
  user: { name?: string | null }
  notifications: DeploymentRow[]
}

export default function Topbar({ user, notifications }: Props) {
  const triggerPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
  }

  return (
    <header
      className="h-12 flex-shrink-0 flex items-center justify-between px-6"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Search trigger */}
      <button
        type="button"
        onClick={triggerPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[rgba(235,235,245,0.35)] hover:text-[rgba(235,235,245,0.65)] hover:bg-white/[0.05] transition-colors duration-150"
        style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Search</span>
        <kbd
          className="ml-1 text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell notifications={notifications} />
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#5e5ce6,#3634a3)" }}
          >
            {user.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <span className="text-xs text-[rgba(235,235,245,0.6)] hidden sm:block">{user.name}</span>
        </div>
      </div>
    </header>
  )
}
