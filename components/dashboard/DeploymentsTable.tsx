"use client"
import { formatRelativeTime, formatDuration, truncateSha } from "@/lib/utils"
import type { DeploymentRow } from "@/types"

const STATUS: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  success:   { dot: "bg-[#30d158]",               text: "text-[#30d158]",  bg: "bg-[rgba(48,209,88,0.1)]",   label: "Success" },
  failed:    { dot: "bg-[#ff453a]",               text: "text-[#ff6961]",  bg: "bg-[rgba(255,69,58,0.1)]",   label: "Failed" },
  running:   { dot: "bg-[#0a84ff] animate-pulse", text: "text-[#409cff]",  bg: "bg-[rgba(10,132,255,0.1)]",  label: "Running" },
  pending:   { dot: "bg-[#ff9f0a]",               text: "text-[#ff9f0a]",  bg: "bg-[rgba(255,159,10,0.1)]",  label: "Pending" },
  cancelled: { dot: "bg-white/30",                text: "text-white/40",   bg: "bg-white/5",                  label: "Cancelled" },
}

interface Props {
  deployments: DeploymentRow[]
  onRowClick?: (d: DeploymentRow) => void
}

export default function DeploymentsTable({ deployments, onRowClick }: Props) {
  if (deployments.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-[rgba(235,235,245,0.3)]">
        No deployments yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
            {["Project", "Version", "Env", "Status", "By", "Time"].map(h => (
              <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-[rgba(235,235,245,0.35)] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deployments.map(d => {
            const st = STATUS[d.status] ?? STATUS.cancelled
            return (
              <tr
                key={d.id}
                onClick={() => onRowClick?.(d)}
                className={`transition-colors duration-100 ${onRowClick ? "cursor-pointer hover:bg-white/[0.035]" : "hover:bg-white/[0.02]"}`}
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}
              >
                <td className="px-5 py-3">
                  <div className="text-[13px] font-medium text-white">{d.project.name}</div>
                  <div className="text-[11px] text-[rgba(235,235,245,0.35)] mt-0.5">{d.project.client}</div>
                </td>
                <td className="px-5 py-3">
                  <code className="text-xs font-mono text-[rgba(235,235,245,0.7)]">{d.version}</code>
                  {d.commitSha && (
                    <div className="text-[10px] font-mono text-[rgba(235,235,245,0.28)] mt-0.5">{truncateSha(d.commitSha)}</div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-medium capitalize px-1.5 py-0.5 rounded-md ${
                    d.environment === "production"
                      ? "text-[#409cff] bg-[rgba(10,132,255,0.12)]"
                      : "text-[rgba(235,235,245,0.5)] bg-white/[0.07]"
                  }`}>
                    {d.environment}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${st.text} ${st.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                    {st.label}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[rgba(235,235,245,0.4)] max-w-[100px] truncate">
                  {d.triggeredBy.split("@")[0]}
                </td>
                <td className="px-5 py-3 text-xs text-[rgba(235,235,245,0.35)] whitespace-nowrap">
                  {formatRelativeTime(new Date(d.createdAt))}
                  {d.duration && (
                    <span className="text-[rgba(235,235,245,0.25)] ml-1">· {formatDuration(d.duration)}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
