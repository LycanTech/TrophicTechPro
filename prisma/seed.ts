import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const HASH = (p: string) => bcrypt.hashSync(p, 10)

async function main() {
  // ── Users ────────────────────────────────────────────────
  await prisma.user.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "usr_admin",
        email: "admin@trophictech.io",
        name: "Alex Mercer",
        password: HASH("demo1234"),
        role: "admin",
      },
      {
        id: "usr_engineer1",
        email: "jamie@trophictech.io",
        name: "Jamie Okonkwo",
        password: HASH("demo1234"),
        role: "engineer",
      },
      {
        id: "usr_engineer2",
        email: "priya@trophictech.io",
        name: "Priya Sharma",
        password: HASH("demo1234"),
        role: "engineer",
      },
      {
        id: "usr_viewer",
        email: "client@nordstrom.com",
        name: "Dana Klein",
        password: HASH("demo1234"),
        role: "viewer",
      },
    ],
  })

  // ── Projects ──────────────────────────────────────────────
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: "proj_fintech" },
      update: {},
      create: {
        id: "proj_fintech",
        name: "Payments Platform",
        client: "Capital One",
        repo: "trophictech/capital-one-payments",
        description: "Real-time payment processing microservices on AKS",
        status: "active",
        tech: ["Next.js", "Go", "Kafka", "PostgreSQL", "AKS"],
      },
    }),
    prisma.project.upsert({
      where: { id: "proj_ecomm" },
      update: {},
      create: {
        id: "proj_ecomm",
        name: "E-Commerce Rebuild",
        client: "Nordstrom",
        repo: "trophictech/nordstrom-commerce",
        description: "Headless commerce platform with Next.js and Contentful",
        status: "active",
        tech: ["Next.js", "TypeScript", "Contentful", "Redis", "AKS"],
      },
    }),
    prisma.project.upsert({
      where: { id: "proj_data" },
      update: {},
      create: {
        id: "proj_data",
        name: "Data Intelligence Platform",
        client: "Microsoft",
        repo: "trophictech/msft-data-platform",
        description: "Unified data ingestion and analytics pipeline on Azure",
        status: "active",
        tech: ["Python", "Spark", "Azure Data Factory", "Databricks", "AKS"],
      },
    }),
    prisma.project.upsert({
      where: { id: "proj_mobile" },
      update: {},
      create: {
        id: "proj_mobile",
        name: "Consumer Mobile API",
        client: "Nike",
        repo: "trophictech/nike-consumer-api",
        description: "High-throughput REST API serving 50M mobile users",
        status: "maintenance",
        tech: ["Node.js", "Fastify", "PostgreSQL", "Redis", "AKS"],
      },
    }),
    prisma.project.upsert({
      where: { id: "proj_ai" },
      update: {},
      create: {
        id: "proj_ai",
        name: "AI Insights Engine",
        client: "Salesforce",
        repo: "trophictech/sfdc-ai-engine",
        description: "LLM-powered customer insight generation at scale",
        status: "active",
        tech: ["Python", "FastAPI", "Claude API", "pgvector", "AKS"],
      },
    }),
    prisma.project.upsert({
      where: { id: "proj_legacy" },
      update: {},
      create: {
        id: "proj_legacy",
        name: "Legacy Migration",
        client: "Wells Fargo",
        repo: "trophictech/wf-modernisation",
        description: "Strangler-fig migration of 20-year-old Java monolith",
        status: "archived",
        tech: ["Java", "Spring Boot", "Kotlin", "PostgreSQL", "AKS"],
      },
    }),
  ])

  // ── Deployments ────────────────────────────────────────────
  const now = new Date()
  const minsAgo = (n: number) => new Date(now.getTime() - n * 60_000)

  const deploymentSeeds = [
    // Capital One — recent success
    { projectId: "proj_fintech", version: "v2.14.1", branch: "main",        status: "success",  environment: "production", triggeredBy: "jamie@trophictech.io",  duration: 312, commitSha: "a3f9c1d", createdAt: minsAgo(18) },
    { projectId: "proj_fintech", version: "v2.14.0", branch: "main",        status: "success",  environment: "staging",    triggeredBy: "priya@trophictech.io",  duration: 284, commitSha: "b22e8aa", createdAt: minsAgo(95) },
    { projectId: "proj_fintech", version: "v2.13.9", branch: "hotfix/auth", status: "failed",   environment: "staging",    triggeredBy: "jamie@trophictech.io",  duration: 120, commitSha: "c991f03", createdAt: minsAgo(340) },
    { projectId: "proj_fintech", version: "v2.13.8", branch: "main",        status: "success",  environment: "production", triggeredBy: "admin@trophictech.io",  duration: 298, commitSha: "d445b71", createdAt: minsAgo(1440) },
    // Nordstrom — running right now
    { projectId: "proj_ecomm",  version: "v1.8.3",  branch: "feat/pdp",    status: "running",  environment: "staging",    triggeredBy: "priya@trophictech.io",  duration: null, commitSha: "e104da2", createdAt: minsAgo(4) },
    { projectId: "proj_ecomm",  version: "v1.8.2",  branch: "main",        status: "success",  environment: "production", triggeredBy: "priya@trophictech.io",  duration: 267, commitSha: "f88cc93", createdAt: minsAgo(720) },
    { projectId: "proj_ecomm",  version: "v1.8.1",  branch: "main",        status: "success",  environment: "production", triggeredBy: "admin@trophictech.io",  duration: 301, commitSha: "07bbd14", createdAt: minsAgo(2880) },
    // Microsoft — success
    { projectId: "proj_data",   version: "v3.2.0",  branch: "main",        status: "success",  environment: "production", triggeredBy: "admin@trophictech.io",  duration: 544, commitSha: "1a39e52", createdAt: minsAgo(60) },
    { projectId: "proj_data",   version: "v3.1.9",  branch: "refactor/etl",status: "success",  environment: "staging",    triggeredBy: "jamie@trophictech.io",  duration: 487, commitSha: "2c77f90", createdAt: minsAgo(180) },
    // Nike — maintenance window
    { projectId: "proj_mobile", version: "v5.0.1",  branch: "main",        status: "pending",  environment: "production", triggeredBy: "admin@trophictech.io",  duration: null, commitSha: "3d28b61", createdAt: minsAgo(2) },
    { projectId: "proj_mobile", version: "v5.0.0",  branch: "main",        status: "success",  environment: "production", triggeredBy: "jamie@trophictech.io",  duration: 189, commitSha: "4e91c04", createdAt: minsAgo(4320) },
    // Salesforce AI — recent
    { projectId: "proj_ai",     version: "v0.9.4",  branch: "main",        status: "success",  environment: "staging",    triggeredBy: "priya@trophictech.io",  duration: 398, commitSha: "5f02d17", createdAt: minsAgo(30) },
    { projectId: "proj_ai",     version: "v0.9.3",  branch: "feat/rag",    status: "failed",   environment: "staging",    triggeredBy: "priya@trophictech.io",  duration: 210, commitSha: "6a14e28", createdAt: minsAgo(200) },
    { projectId: "proj_ai",     version: "v0.9.2",  branch: "main",        status: "success",  environment: "production", triggeredBy: "admin@trophictech.io",  duration: 412, commitSha: "7b25f39", createdAt: minsAgo(1080) },
  ]

  for (const d of deploymentSeeds) {
    await prisma.deployment.create({ data: d })
  }

  console.log("✅ Seed complete.")
  console.log("   Login: admin@trophictech.io / demo1234")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
