"use client"
import { useState, useMemo } from "react"
import { Search, Package, GitBranch, Clock, CheckCircle2, Wrench, Archive, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatRelativeTime } from "@/lib/utils"
import type { ProjectRow, ProjectStatus } from "@/types"

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; Icon: React.ElementType }> = {
  active:      { label: "Active",      color: "text-[#30d158] bg-[rgba(48,209,88,0.12)]",                   Icon: CheckCircle2 },
  maintenance: { label: "Maintenance", color: "text-[#ff9f0a] bg-[rgba(255,159,10,0.12)]",                  Icon: Wrench },
  archived:    { label: "Archived",    color: "text-[rgba(235,235,245,0.4)] bg-[rgba(255,255,255,0.06)]",   Icon: Archive },
}

const STATUS_TABS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All",         value: "all" },
  { label: "Active",      value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Archived",    value: "archived" },
]

interface Props {
  projects: ProjectRow[]
  activeCount: number
}

export function ProjectsShell({ projects, activeCount }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<ProjectStatus | "all">("all")

  const filtered = useMemo(() => {
    let rows = projects
    if (tab !== "all") rows = rows.filter(p => p.status === tab)
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.tech.some(t => t.toLowerCase().includes(q))
      )
    }
    return rows
  }, [projects, tab, query])

  return (
    <div className="space-y-5 animate-[fade-in_0.3s_ease_forwards]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white">Projects</h1>
          <p className="mt-0.5 text-sm text-[rgba(235,235,245,0.5)]">
            {activeCount} active · {projects.length} total engagements
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-[10px]"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-[rgba(235,235,245,0.3)] flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, clients, tech…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(235,235,245,0.3)] outline-none"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {STATUS_TABS.map(t => {
            const count = t.value === "all" ? projects.length : projects.filter(p => p.status === t.value).length
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: tab === t.value ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === t.value ? "#fff" : "rgba(235,235,245,0.45)",
                }}
              >
                {t.label}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-[rgba(235,235,245,0.3)]">
          No projects match your search
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project, i) => {
            const cfg = STATUS_CONFIG[project.status as ProjectStatus] ?? STATUS_CONFIG.archived
            const StatusIcon = cfg.Icon
            const lastDeploy = project.deployments[0]

            return (
              <div
                key={project.id}
                className="card p-5 flex flex-col gap-4 group hover:shadow-[0_12px_40px_rgba(0,0,0,0.52)] transition-all duration-200 cursor-default"
                style={{ animation: `fade-in 0.4s ease ${i * 55}ms both` }}
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] text-white truncate">{project.name}</h3>
                    <p className="text-xs text-[rgba(235,235,245,0.45)] mt-0.5">{project.client}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${cfg.color}`}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {cfg.label}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-[rgba(235,235,245,0.5)] leading-relaxed line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Tech chips */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium text-[rgba(235,235,245,0.6)]"
                      style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Footer stats + hover action */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-4 text-xs text-[rgba(235,235,245,0.4)]">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {project._count.deployments}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      <span className="font-mono truncate max-w-[100px]">{project.repo.split("/")[1]}</span>
                    </span>
                    {lastDeploy && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(new Date(lastDeploy.createdAt))}
                      </span>
                    )}
                  </div>

                  {/* Reveal on hover */}
                  <button
                    type="button"
                    onClick={() => router.push("/pipeline")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[rgba(235,235,245,0.5)] hover:text-white transition-all duration-150 opacity-0 group-hover:opacity-100"
                    style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)" }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Deployments
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
