import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  name:        z.string().min(1).max(80),
  client:      z.string().min(1).max(80),
  repo:        z.string().min(1),
  description: z.string().optional(),
  tech:        z.array(z.string()).default([]),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { deployments: true } },
      deployments: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
      },
    },
  })

  return NextResponse.json(projects)
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

  const project = await prisma.project.create({ data: parsed.data })
  return NextResponse.json(project, { status: 201 })
}
