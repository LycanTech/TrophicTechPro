import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ProjectsShell } from "@/components/projects/ProjectsShell"
import type { ProjectRow } from "@/types"

export const metadata: Metadata = { title: "Projects" }

async function getProjects(): Promise<ProjectRow[]> {
  return prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { deployments: true } },
      deployments: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
      },
    },
  }) as Promise<ProjectRow[]>
}

export default async function ProjectsPage() {
  const projects = await getProjects()
  const activeCount = projects.filter(p => p.status === "active").length

  return <ProjectsShell projects={projects} activeCount={activeCount} />
}
