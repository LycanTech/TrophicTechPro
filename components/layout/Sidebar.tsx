"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, FolderKanban, GitBranch, Users, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/",         label: "Dashboard", Icon: LayoutDashboard },
  { href: "/projects", label: "Projects",  Icon: FolderKanban },
  { href: "/pipeline", label: "Pipeline",  Icon: GitBranch },
  { href: "/team",     label: "Team",      Icon: Users },
]

interface Props {
  user: { name?: string | null; email?: string | null }
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-full border-r border-white/[0.06]"
           style={{ background: "#111113" }}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
             style={{ background: "linear-gradient(135deg,#0a84ff,#0040c1)", boxShadow: "0 4px 12px rgba(10,132,255,0.35)" }}>
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L25 9.5V18.5L14 25L3 18.5V9.5L14 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 9L20 12.5V19.5L14 23L8 19.5V12.5L14 9Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white leading-tight truncate">Trophic Tech</div>
          <div className="text-[11px] text-[rgba(235,235,245,0.35)] leading-tight">Mission Control</div>
        </div>
      </div>

      <div className="h-px mx-4 bg-white/[0.06] mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-[rgba(235,235,245,0.5)] hover:text-white hover:bg-white/[0.05]"
                  )}>
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#0a84ff]" : "text-current")} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0a84ff]" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white"
               style={{ background: "linear-gradient(135deg,#5e5ce6,#3634a3)" }}>
            {user.name?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-white truncate">{user.name}</div>
            <div className="text-[10px] text-[rgba(235,235,245,0.35)] truncate">{user.email}</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-1 rounded-md text-[rgba(235,235,245,0.3)] hover:text-[#ff453a] hover:bg-[rgba(255,69,58,0.1)] transition-colors duration-150"
                  title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
