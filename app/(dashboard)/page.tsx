import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import type { DashboardMetrics, DeploymentRow, ActivityDay } from "@/types"

export const metadata: Metadata = { title: "Dashboard" }

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    allDeployments,
    thisMonthDeps,
    lastMonthDeps,
    activeProjects,
    recentDeployments,
    latestDep,
    avgResult,
    lastMonthSuccessCount,
    recentForActivity,
  ] = await Promise.all([
    prisma.deployment.count(),
    prisma.deployment.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.deployment.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.project.count({ where: { status: "active" } }),
    prisma.deployment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { project: { select: { id: true, name: true, client: true } } },
    }),
    prisma.deployment.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.deployment.aggregate({
      _avg: { duration: true },
      where: { status: "success", duration: { not: null } },
    }),
    prisma.deployment.count({
      where: { status: "success", createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
    prisma.deployment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, status: true },
    }),
  ])

  const successCount = await prisma.deployment.count({ where: { status: "success" } })
  const successRate = allDeployments > 0 ? (successCount / allDeployments) * 100 : 0
  const successRateLastMonth = lastMonthDeps > 0 ? (lastMonthSuccessCount / lastMonthDeps) * 100 : 0

  const metrics: DashboardMetrics = {
    totalDeployments:     allDeployments,
    successRate:          Math.round(successRate * 10) / 10,
    activeProjects,
    avgDurationSeconds:   Math.round(avgResult._avg.duration ?? 0),
    deploymentsThisMonth: thisMonthDeps,
    deploymentsLastMonth: lastMonthDeps,
    successRateLastMonth: Math.round(successRateLastMonth * 10) / 10,
  }

  // Build 7-day activity map
  const dateMap = new Map<string, ActivityDay>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    dateMap.set(key, { date: key, total: 0, success: 0, failed: 0 })
  }
  for (const dep of recentForActivity) {
    const key = new Date(dep.createdAt).toISOString().split("T")[0]
    const day = dateMap.get(key)
    if (day) {
      day.total++
      if (dep.status === "success") day.success++
      if (dep.status === "failed")  day.failed++
    }
  }
  const activityData = Array.from(dateMap.values())

  return {
    metrics,
    recentDeployments: recentDeployments as DeploymentRow[],
    latestDep,
    activityData,
  }
}

export default async function DashboardPage() {
  const { metrics, recentDeployments, latestDep, activityData } = await getDashboardData()

  return (
    <DashboardShell
      metrics={metrics}
      recentDeployments={recentDeployments}
      latestDep={latestDep}
      activityData={activityData}
    />
  )
}
