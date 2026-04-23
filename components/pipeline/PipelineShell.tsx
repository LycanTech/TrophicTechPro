"use client"
import { useState, useMemo, useCallback } from "react"
import { Search, Plus, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { Drawer } from "@/components/ui/Drawer"
import { TriggerModal } from "@/components/pipeline/TriggerModal"
import { useToast } from "@/components/ui/Toast"
import { formatDuration, formatRelativeTime, truncateSha } from "@/lib/utils"
import type { DeploymentRow, DeployStatus } from "@/types"

const STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  success:   { dot: "bg-[#30d158]",               badge: "text-[#30d158] bg-[rgba(48,209,88,0.12)]",   label: "Success" },
  failed:    { dot: "bg-[#ff453a]",               badge: "text-[#ff6961] bg-[rgba(255,69,58,0.12)]",   label: "Failed" },
  running:   { dot: "bg-[#0a84ff] animate-pulse", badge: "text-[#409cff] bg-[rgba(10,132,255,0.12)]",  label: "Running" },
  pending:   { dot: "bg-[#ff9f0a]",               badge: "text-[#ff9f0a] bg-[rgba(255,159,10,0.12)]",  label: "Pending" },
  cancelled: { dot: "bg-white/30",                badge: "text-white/40 bg-white/5",                   label: "Cancelled" },
}

const ENV_BADGE: Record<string, string> = {
  production: "text-[#409cff] bg-[rgba(10,132,255,0.12)]",
  staging:    "text-[rgba(235,235,245,0.6)] bg-white/[0.07]",
}

const STATUS_TABS: { label: string; value: DeployStatus | "all" }[] = [
  { label: "All",      value: "all" },
  { label: "Running",  value: "running" },
  { label: "Success",  value: "success" },
  { label: "Failed",   value: "failed" },
  { label: "Pending",  value: "pending" },
]

type SortKey = "createdAt" | "project" | "version" | "status" | "duration"
type SortDir = "asc" | "desc"

interface Props {
  deployments: DeploymentRow[]
  runningCount: number
  failedCount: number
}

export function PipelineShell({ deployments, runningCount, failedCount }: Props) {
  const toast = useToast()
  const [query, setQuery] = useState("")
  const [statusTab, setStatusTab] = useState<DeployStatus | "all">("all")
  const [envFilter, setEnvFilter] = useState<"all" | "production" | "staging">("all")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selected, setSelected] = useState<DeploymentRow | null>(null)
  const [triggerOpen, setTriggerOpen] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-[#0a84ff]" />
      : <ChevronDown className="w-3 h-3 text-[#0a84ff]" />
  }

  const filtered = useMemo(() => {
    let rows = deployments

    if (statusTab !== "all") rows = rows.filter(d => d.status === statusTab)
    if (envFilter !== "all") rows = rows.filter(d => d.environment === envFilter)

    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(d =>
        d.project.name.toLowerCase().includes(q) ||
        d.project.client.toLowerCase().includes(q) ||
        d.version.toLowerCase().includes(q) ||
        d.branch.toLowerCase().includes(q) ||
        d.triggeredBy.toLowerCase().includes(q)
      )
    }

    return [...rows].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
        case "project":   cmp = a.project.name.localeCompare(b.project.name); break
        case "version":   cmp = a.version.localeCompare(b.version); break
        case "status":    cmp = a.status.localeCompare(b.status); break
        case "duration":  cmp = (a.duration ?? 0) - (b.duration ?? 0); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [deployments, statusTab, envFilter, query, sortKey, sortDir])

  const copyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id).catch(() => {})
    setSelected(null)
    toast.info("Copied", "Deployment ID copied to clipboard")
  }, [toast])

  const COLS: { label: string; key?: SortKey; className: string }[] = [
    { label: "Project / Client",  key: "project",   className: "min-w-[160px]" },
    { label: "Version",           key: "version",   className: "min-w-[120px]" },
    { label: "Branch",                              className: "min-w-[100px]" },
    { label: "Environment",                         className: "min-w-[110px]" },
    { label: "Status",            key: "status",    className: "min-w-[110px]" },
    { label: "Triggered By",                        className: "min-w-[120px]" },
    { label: "Duration",          key: "duration",  className: "min-w-[90px]" },
    { label: "Time",              key: "createdAt", className: "min-w-[100px]" },
  ]

  return (
    <>
      <div className="space-y-5 animate-[fade-in_0.3s_ease_forwards]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">Pipeline</h1>
            <p className="mt-0.5 text-sm text-[rgba(235,235,245,0.5)]">
              {runningCount > 0 && <span className="text-[#409cff]">{runningCount} running · </span>}
              {failedCount > 0  && <span className="text-[#ff6961]">{failedCount} failed · </span>}
              {deployments.length} total runs shown
            </p>
          </div>
          <button type="button" onClick={() => setTriggerOpen(true)} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" />
            Trigger Run
          </button>
        </div>

        {/* Filters row */}
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
              placeholder="Search project, version, branch…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(235,235,245,0.3)] outline-none"
            />
          </div>

          {/* Environment filter */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}>
            {(["all", "production", "staging"] as const).map(env => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvFilter(env)}
                className="px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-100"
                style={{
                  background: envFilter === env ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: envFilter === env ? "#fff" : "rgba(235,235,245,0.45)",
                }}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {STATUS_TABS.map(tab => {
            const count = tab.value === "all"
              ? deployments.length
              : deployments.filter(d => d.status === tab.value).length
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusTab(tab.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: statusTab === tab.value ? "rgba(255,255,255,0.1)" : "transparent",
                  color: statusTab === tab.value ? "#fff" : "rgba(235,235,245,0.45)",
                }}
              >
                {tab.label}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                  {COLS.map(col => (
                    <th
                      key={col.label}
                      className={`px-4 py-3 text-left text-[11px] font-medium text-[rgba(235,235,245,0.4)] uppercase tracking-wide whitespace-nowrap ${col.className}`}
                    >
                      {col.key ? (
                        <button
                          type="button"
                          onClick={() => col.key && handleSort(col.key)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {col.label}
                          <SortIcon col={col.key} />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-[rgba(235,235,245,0.3)]">
                      No deployments match your filters
                    </td>
                  </tr>
                ) : filtered.map((d, i) => {
                  const st = STATUS_STYLES[d.status] ?? STATUS_STYLES.cancelled
                  const envStyle = ENV_BADGE[d.environment] ?? ENV_BADGE.staging
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelected(d)}
                      className="cursor-pointer transition-colors duration-100 hover:bg-white/[0.03]"
                      style={{
                        borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                        background: i % 2 !== 0 ? "rgba(255,255,255,0.01)" : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{d.project.name}</div>
                        <div className="text-xs text-[rgba(235,235,245,0.4)] mt-0.5">{d.project.client}</div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-[rgba(235,235,245,0.7)]">{d.version}</code>
                        {d.commitSha && (
                          <div className="text-[10px] font-mono text-[rgba(235,235,245,0.3)] mt-0.5">{truncateSha(d.commitSha)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-[rgba(235,235,245,0.6)]">{d.branch}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${envStyle}`}>
                          {d.environment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[rgba(235,235,245,0.5)] max-w-[140px] truncate">
                        {d.triggeredBy.split("@")[0]}
                      </td>
                      <td className="px-4 py-3 text-xs text-[rgba(235,235,245,0.5)] font-mono whitespace-nowrap">
                        {formatDuration(d.duration)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[rgba(235,235,245,0.4)] whitespace-nowrap">
                        {formatRelativeTime(new Date(d.createdAt))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row detail drawer */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.project.name} · ${selected.version}` : ""}
        subtitle={selected ? `${selected.environment} · ${selected.status}` : ""}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Status",       value: selected.status },
                { label: "Environment",  value: selected.environment },
                { label: "Branch",       value: selected.branch },
                { label: "Version",      value: selected.version },
                { label: "Triggered by", value: selected.triggeredBy.split("@")[0] },
                { label: "Duration",     value: formatDuration(selected.duration) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="text-[11px] text-[rgba(235,235,245,0.4)] mb-1">{label}</div>
                  <div className="text-[13px] font-medium text-white capitalize truncate">{value}</div>
                </div>
              ))}
            </div>

            {selected.commitSha && (
              <div
                className="p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-[11px] text-[rgba(235,235,245,0.4)] mb-1">Commit SHA</div>
                <code className="text-[13px] font-mono text-[rgba(235,235,245,0.7)] break-all">{selected.commitSha}</code>
              </div>
            )}

            <div
              className="p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)" }}
            >
              <div className="text-[11px] text-[rgba(235,235,245,0.4)] mb-1">Deployed</div>
              <div className="text-[13px] text-white">{formatRelativeTime(new Date(selected.createdAt))}</div>
            </div>

            <button
              type="button"
              onClick={() => copyId(selected.id)}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-[rgba(235,235,245,0.6)] hover:text-white transition-colors duration-150"
              style={{ border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            >
              Copy deployment ID
            </button>
          </div>
        )}
      </Drawer>

      <TriggerModal isOpen={triggerOpen} onClose={() => setTriggerOpen(false)} />
    </>
  )
}
