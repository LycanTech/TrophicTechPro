import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json([], { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) return NextResponse.json([])

  const [projects, deployments] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { name:   { contains: q, mode: "insensitive" } },
          { client: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, client: true },
    }),
    prisma.deployment.findMany({
      where: {
        OR: [
          { version:     { contains: q, mode: "insensitive" } },
          { branch:      { contains: q, mode: "insensitive" } },
          { triggeredBy: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, version: true, status: true, environment: true, branch: true,
        project: { select: { name: true } },
      },
    }),
  ])

  const results = [
    ...projects.map(p => ({
      id:       p.id,
      type:     "project" as const,
      title:    p.name,
      subtitle: p.client,
      href:     "/projects",
    })),
    ...deployments.map(d => ({
      id:       d.id,
      type:     "deployment" as const,
      title:    `${d.project.name} · ${d.version}`,
      subtitle: `${d.status} · ${d.environment} · ${d.branch}`,
      href:     "/pipeline",
    })),
  ]

  return NextResponse.json(results)
}
