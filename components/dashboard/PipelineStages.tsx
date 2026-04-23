import { CheckCircle2, XCircle, Loader2, Circle } from "lucide-react"
import { formatDuration } from "@/lib/utils"

type Stage = {
  name: string
  status: "success" | "failed" | "running" | "pending"
  duration?: number
}

function deriveStages(deployment: { status: string; duration: number | null } | null): Stage[] {
  if (!deployment) {
    return [
      { name: "Security Scan", status: "pending" },
      { name: "Unit Tests",    status: "pending" },
      { name: "Docker Build",  status: "pending" },
      { name: "Push to ACR",   status: "pending" },
      { name: "Deploy to AKS", status: "pending" },
    ]
  }

  const total = deployment.duration ?? 300
  const splits = [0.12, 0.22, 0.28, 0.12, 0.26]
  const names = ["Security Scan", "Unit Tests", "Docker Build", "Push to ACR", "Deploy to AKS"]

  if (deployment.status === "success") {
    return names.map((name, i) => ({ name, status: "success", duration: Math.round(total * splits[i]) }))
  }
  if (deployment.status === "failed") {
    const failAt = 2
    return names.map((name, i) => ({
      name,
      status: i < failAt ? "success" : i === failAt ? "failed" : "pending",
      duration: i < failAt ? Math.round(total * splits[i]) : undefined,
    }))
  }
  if (deployment.status === "running") {
    return names.map((name, i) => ({
      name,
      status: i === 0 ? "success" : i === 1 ? "running" : "pending",
    }))
  }
  return names.map(name => ({ name, status: "pending" }))
}

const STAGE_ICON = {
  success: <CheckCircle2 className="w-4 h-4 text-[#30d158]" />,
  failed:  <XCircle      className="w-4 h-4 text-[#ff453a]" />,
  running: <Loader2      className="w-4 h-4 text-[#0a84ff] animate-spin" />,
  pending: <Circle       className="w-4 h-4 text-[rgba(235,235,245,0.2)]" />,
}

const STAGE_LINE = {
  success: "bg-[#30d158]",
  failed:  "bg-[#ff453a]",
  running: "bg-[#0a84ff]",
  pending: "bg-white/10",
}

export default function PipelineStages({
  deployment,
}: {
  deployment: { status: string; duration: number | null } | null
}) {
  const stages = deriveStages(deployment)

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => (
        <div key={stage.name}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{STAGE_ICON[stage.status]}</div>
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] font-medium ${
                stage.status === "pending" ? "text-[rgba(235,235,245,0.35)]" : "text-white"
              }`}>
                {stage.name}
              </div>
              {stage.duration && (
                <div className="text-[11px] text-[rgba(235,235,245,0.3)] font-mono mt-0.5">
                  {formatDuration(stage.duration)}
                </div>
              )}
            </div>
          </div>
          {i < stages.length - 1 && (
            <div className="ml-[7px] w-0.5 h-3 mt-1"
                 style={{ background: stage.status === "success" ? "rgba(48,209,88,0.3)" : "rgba(255,255,255,0.06)" }} />
          )}
        </div>
      ))}

      {deployment && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[rgba(235,235,245,0.4)]">Total duration</span>
            <span className="font-mono text-[rgba(235,235,245,0.7)]">
              {formatDuration(deployment.duration)}
            </span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${STAGE_LINE[deployment.status as keyof typeof STAGE_LINE] ?? "bg-white/20"}`}
              style={{ width: deployment.status === "success" ? "100%" : deployment.status === "running" ? "40%" : "30%" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
