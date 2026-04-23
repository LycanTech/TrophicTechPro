"use client"
import { Rocket, CheckCircle2, FolderKanban, Timer } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { useCountUp } from "@/hooks/useCountUp"
import type { DashboardMetrics } from "@/types"

interface MetricCardProps {
  label: string
  rawValue: number
  format: (v: number) => string
  trend: string
  trendUp: boolean
  Icon: React.ElementType
  iconColor: string
  iconBg: string
  delay?: number
}

function MetricCard({ label, rawValue, format, trend, trendUp, Icon, iconColor, iconBg, delay = 0 }: MetricCardProps) {
  const count = useCountUp(rawValue, 900, delay)

  return (
    <div
      className="card p-5"
      style={{ animation: `fade-in 0.4s ease ${delay}ms both` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`${iconColor}`} size={18} />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          trendUp
            ? "text-[#30d158] bg-[rgba(48,209,88,0.12)]"
            : "text-[rgba(235,235,245,0.4)] bg-white/[0.06]"
        }`}>
          {trend}
        </span>
      </div>

      <div className="text-[28px] font-semibold text-white tracking-tight leading-none mb-1">
        {format(count)}
      </div>
      <div className="text-xs text-[rgba(235,235,245,0.45)]">{label}</div>
    </div>
  )
}

export default function MetricsGrid({ metrics }: { metrics: DashboardMetrics }) {
  const depTrend = metrics.deploymentsLastMonth > 0
    ? Math.round(((metrics.deploymentsThisMonth - metrics.deploymentsLastMonth) / metrics.deploymentsLastMonth) * 100)
    : 0
  const rateDiff = Math.round((metrics.successRate - metrics.successRateLastMonth) * 10) / 10

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        label="Total Deployments"
        rawValue={metrics.totalDeployments}
        format={v => v.toLocaleString()}
        trend={depTrend >= 0 ? `+${depTrend}% this month` : `${depTrend}% this month`}
        trendUp={depTrend >= 0}
        Icon={Rocket}
        iconColor="text-[#0a84ff]"
        iconBg="bg-[rgba(10,132,255,0.15)]"
        delay={0}
      />
      <MetricCard
        label="Success Rate"
        rawValue={Math.round(metrics.successRate)}
        format={v => `${v}%`}
        trend={rateDiff >= 0 ? `+${rateDiff}% vs last month` : `${rateDiff}% vs last month`}
        trendUp={rateDiff >= 0}
        Icon={CheckCircle2}
        iconColor="text-[#30d158]"
        iconBg="bg-[rgba(48,209,88,0.15)]"
        delay={80}
      />
      <MetricCard
        label="Active Projects"
        rawValue={metrics.activeProjects}
        format={v => v.toString()}
        trend="Currently live"
        trendUp={true}
        Icon={FolderKanban}
        iconColor="text-[#5e5ce6]"
        iconBg="bg-[rgba(94,92,230,0.15)]"
        delay={160}
      />
      <MetricCard
        label="Avg Deploy Time"
        rawValue={metrics.avgDurationSeconds}
        format={v => formatDuration(Math.round(v))}
        trend="Successful runs"
        trendUp={true}
        Icon={Timer}
        iconColor="text-[#ff9f0a]"
        iconBg="bg-[rgba(255,159,10,0.15)]"
        delay={240}
      />
    </div>
  )
}
