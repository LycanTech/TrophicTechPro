"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import MetricsGrid from "@/components/dashboard/MetricsGrid"
import DeploymentsTable from "@/components/dashboard/DeploymentsTable"
import PipelineStages from "@/components/dashboard/PipelineStages"
import { ActivityChart } from "@/components/dashboard/ActivityChart"
import { Drawer } from "@/components/ui/Drawer"
import { useToast } from "@/components/ui/Toast"
import { formatDuration, formatRelativeTime } from "@/lib/utils"
import type { DashboardMetrics, DeploymentRow, ActivityDay } from "@/types"

interface Props {
  metrics: DashboardMetrics
  recentDeployments: DeploymentRow[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latestDep: any
  activityData: ActivityDay[]
}

export function DashboardShell({ metrics, recentDeployments, latestDep, activityData }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<DeploymentRow | null>(null)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    router.refresh()
    await new Promise(r => setTimeout(r, 900))
    setRefreshing(false)
  }, [router])

  // Auto-refresh every 30 s
  useEffect(() => {
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  const copyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id).catch(() => {})
    setSelected(null)
    toast.info("Copied to clipboard", "Deployment ID copied")
  }, [toast])

  return (
    <>
      <div className="space-y-6 animate-[fade-in_0.3s_ease_forwards]">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-0.5 text-sm text-[rgba(235,235,245,0.5)]">
              Live view of all Trophic Tech deployment activity
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-xs text-[rgba(235,235,245,0.35)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-[pulse-dot_2s_ease-in-out_infinite]" />
              Live
            </span>
            <button
              type="button"
              onClick={refresh}
              title="Refresh"
              className="p-1.5 rounded-lg text-[rgba(235,235,245,0.35)] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Count-up metric cards */}
        <MetricsGrid metrics={metrics} />

        {/* 7-day activity chart */}
        <div className="card p-5">
          <ActivityChart data={activityData} />
        </div>

        {/* Table + pipeline sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-[15px] font-semibold text-white">Recent Deployments</h2>
              <p className="text-xs text-[rgba(235,235,245,0.4)] mt-0.5">Click any row for full details</p>
            </div>
            <DeploymentsTable deployments={recentDeployments} onRowClick={setSelected} />
          </div>

          <div className="card p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Pipeline Status</h2>
            <PipelineStages deployment={latestDep} />
          </div>
        </div>
      </div>

      {/* Deployment detail drawer */}
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
    </>
  )
}
