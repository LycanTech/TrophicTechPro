import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({
  projectId:   z.string().min(1),
  branch:      z.string().min(1).max(120),
  environment: z.enum(["staging", "production"]),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const raw = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { projectId, branch, environment } = parsed.data

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  const today = new Date().toISOString().split("T")[0].replace(/-/g, ".")
  const triggeredBy = session.user.email ?? session.user.name ?? "unknown"

  const deployment = await prisma.deployment.create({
    data: {
      projectId,
      branch,
      environment,
      version:     `v${today}-manual`,
      status:      "pending",
      triggeredBy,
    },
  })

  return NextResponse.json({ id: deployment.id }, { status: 201 })
}
