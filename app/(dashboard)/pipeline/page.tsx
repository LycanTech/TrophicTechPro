import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { PipelineShell } from "@/components/pipeline/PipelineShell"
import type { DeploymentRow } from "@/types"

export const metadata: Metadata = { title: "Pipeline" }

async function getAllDeployments(): Promise<DeploymentRow[]> {
  return prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { project: { select: { id: true, name: true, client: true } } },
  }) as Promise<DeploymentRow[]>
}

export default async function PipelinePage() {
  const deployments = await getAllDeployments()
  const runningCount = deployments.filter(d => d.status === "running").length
  const failedCount  = deployments.filter(d => d.status === "failed").length

  return (
    <PipelineShell
      deployments={deployments}
      runningCount={runningCount}
      failedCount={failedCount}
    />
  )
}
