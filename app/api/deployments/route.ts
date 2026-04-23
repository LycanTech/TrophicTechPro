import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  projectId:   z.string().cuid(),
  version:     z.string().min(1),
  branch:      z.string().default("main"),
  status:      z.enum(["success", "failed", "running", "pending", "cancelled"]),
  environment: z.enum(["production", "staging"]),
  triggeredBy: z.string().email(),
  duration:    z.number().int().positive().nullable().optional(),
  commitSha:   z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100)

  const deployments = await prisma.deployment.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { project: { select: { id: true, name: true, client: true } } },
  })

  return NextResponse.json(deployments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const deployment = await prisma.deployment.create({ data: parsed.data })
  return NextResponse.json(deployment, { status: 201 })
}
