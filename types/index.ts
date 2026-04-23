export type DeployStatus = "success" | "failed" | "running" | "pending" | "cancelled"
export type ProjectStatus = "active" | "maintenance" | "archived"
export type UserRole = "admin" | "engineer" | "viewer"

export interface DeploymentRow {
  id: string
  version: string
  branch: string
  status: DeployStatus
  environment: string
  triggeredBy: string
  duration: number | null
  commitSha: string | null
  createdAt: Date
  project: {
    id: string
    name: string
    client: string
  }
}

export interface ProjectRow {
  id: string
  name: string
  client: string
  repo: string
  description: string | null
  status: ProjectStatus
  tech: string[]
  createdAt: Date
  updatedAt: Date
  _count: { deployments: number }
  deployments: {
    status: string
    createdAt: Date
  }[]
}

export interface DashboardMetrics {
  totalDeployments: number
  successRate: number
  activeProjects: number
  avgDurationSeconds: number
  deploymentsThisMonth: number
  deploymentsLastMonth: number
  successRateLastMonth: number
}

export interface ActivityDay {
  date: string   // YYYY-MM-DD
  total: number
  success: number
  failed: number
}
