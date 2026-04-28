// Standalone-safe seed — no bcryptjs, no tsx required.
// Uses only @prisma/client which is explicitly copied into the runner image.
// Safe to re-run: users/projects use upsert, deployments only seed when table is empty.
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

// bcrypt hash of 'demo1234' at cost 10 — pre-computed so bcryptjs is not needed at runtime
const HASH = '$2b$10$XUf8QvhTlkbC2.Qea8sGgOTHJ7Q3vOakk3cq8WdF..E.V7TP6HLg.'

async function main() {
  // ── Users ──────────────────────────────────────────────────────────────────
  await Promise.all([
    { id: 'usr_chikwex',   email: 'chikwex@trophictech.io', name: 'Chikwex Zingy',  role: 'admin'    },
    { id: 'usr_admin',     email: 'admin@trophictech.io',   name: 'Alex Mercer',    role: 'admin'    },
    { id: 'usr_engineer1', email: 'jamie@trophictech.io',   name: 'Jamie Okonkwo',  role: 'engineer' },
    { id: 'usr_engineer2', email: 'priya@trophictech.io',   name: 'Priya Sharma',   role: 'engineer' },
    { id: 'usr_viewer',    email: 'client@nordstrom.com',   name: 'Dana Klein',     role: 'viewer'   },
  ].map(u => p.user.upsert({
    where:  { email: u.email },
    update: {},
    create: { ...u, password: HASH },
  })))

  // ── Projects ───────────────────────────────────────────────────────────────
  await Promise.all([
    { id: 'proj_fintech', name: 'Payments Platform',         client: 'Capital One', repo: 'trophictech/capital-one-payments',  description: 'Real-time payment processing microservices on AKS',              status: 'active',      tech: ['Next.js', 'Go', 'Kafka', 'PostgreSQL', 'AKS']                     },
    { id: 'proj_ecomm',   name: 'E-Commerce Rebuild',        client: 'Nordstrom',   repo: 'trophictech/nordstrom-commerce',    description: 'Headless commerce platform with Next.js and Contentful',         status: 'active',      tech: ['Next.js', 'TypeScript', 'Contentful', 'Redis', 'AKS']             },
    { id: 'proj_data',    name: 'Data Intelligence Platform', client: 'Microsoft',   repo: 'trophictech/msft-data-platform',   description: 'Unified data ingestion and analytics pipeline on Azure',         status: 'active',      tech: ['Python', 'Spark', 'Azure Data Factory', 'Databricks', 'AKS']    },
    { id: 'proj_mobile',  name: 'Consumer Mobile API',        client: 'Nike',        repo: 'trophictech/nike-consumer-api',    description: 'High-throughput REST API serving 50M mobile users',              status: 'maintenance', tech: ['Node.js', 'Fastify', 'PostgreSQL', 'Redis', 'AKS']               },
    { id: 'proj_ai',      name: 'AI Insights Engine',         client: 'Salesforce',  repo: 'trophictech/sfdc-ai-engine',       description: 'LLM-powered customer insight generation at scale',               status: 'active',      tech: ['Python', 'FastAPI', 'Claude API', 'pgvector', 'AKS']             },
    { id: 'proj_legacy',  name: 'Legacy Migration',           client: 'Wells Fargo', repo: 'trophictech/wf-modernisation',     description: 'Strangler-fig migration of 20-year-old Java monolith',          status: 'archived',    tech: ['Java', 'Spring Boot', 'Kotlin', 'PostgreSQL', 'AKS']             },
  ].map(proj => p.project.upsert({
    where:  { id: proj.id },
    update: {},
    create: proj,
  })))

  // ── Deployments (only on first run — not idempotent by nature) ─────────────
  const existing = await p.deployment.count()
  if (existing > 0) {
    console.log(`Seed: ${existing} deployments already exist — skipping.`)
    return
  }

  const now = new Date()
  const ago = mins => new Date(now.getTime() - mins * 60_000)

  await p.deployment.createMany({ data: [
    { projectId: 'proj_fintech', version: 'v2.14.1', branch: 'main',         status: 'success',  environment: 'production', triggeredBy: 'jamie@trophictech.io',  duration: 312,  commitSha: 'a3f9c1d', createdAt: ago(18)   },
    { projectId: 'proj_fintech', version: 'v2.14.0', branch: 'main',         status: 'success',  environment: 'staging',    triggeredBy: 'priya@trophictech.io',  duration: 284,  commitSha: 'b22e8aa', createdAt: ago(95)   },
    { projectId: 'proj_fintech', version: 'v2.13.9', branch: 'hotfix/auth',  status: 'failed',   environment: 'staging',    triggeredBy: 'jamie@trophictech.io',  duration: 120,  commitSha: 'c991f03', createdAt: ago(340)  },
    { projectId: 'proj_fintech', version: 'v2.13.8', branch: 'main',         status: 'success',  environment: 'production', triggeredBy: 'admin@trophictech.io',  duration: 298,  commitSha: 'd445b71', createdAt: ago(1440) },
    { projectId: 'proj_ecomm',   version: 'v1.8.3',  branch: 'feat/pdp',     status: 'running',  environment: 'staging',    triggeredBy: 'priya@trophictech.io',  duration: null, commitSha: 'e104da2', createdAt: ago(4)    },
    { projectId: 'proj_ecomm',   version: 'v1.8.2',  branch: 'main',         status: 'success',  environment: 'production', triggeredBy: 'priya@trophictech.io',  duration: 267,  commitSha: 'f88cc93', createdAt: ago(720)  },
    { projectId: 'proj_ecomm',   version: 'v1.8.1',  branch: 'main',         status: 'success',  environment: 'production', triggeredBy: 'admin@trophictech.io',  duration: 301,  commitSha: '07bbd14', createdAt: ago(2880) },
    { projectId: 'proj_data',    version: 'v3.2.0',  branch: 'main',         status: 'success',  environment: 'production', triggeredBy: 'admin@trophictech.io',  duration: 544,  commitSha: '1a39e52', createdAt: ago(60)   },
    { projectId: 'proj_data',    version: 'v3.1.9',  branch: 'refactor/etl', status: 'success',  environment: 'staging',    triggeredBy: 'jamie@trophictech.io',  duration: 487,  commitSha: '2c77f90', createdAt: ago(180)  },
    { projectId: 'proj_mobile',  version: 'v5.0.1',  branch: 'main',         status: 'pending',  environment: 'production', triggeredBy: 'admin@trophictech.io',  duration: null, commitSha: '3d28b61', createdAt: ago(2)    },
    { projectId: 'proj_mobile',  version: 'v5.0.0',  branch: 'main',         status: 'success',  environment: 'production', triggeredBy: 'jamie@trophictech.io',  duration: 189,  commitSha: '4e91c04', createdAt: ago(4320) },
    { projectId: 'proj_ai',      version: 'v0.9.4',  branch: 'main',         status: 'success',  environment: 'staging',    triggeredBy: 'priya@trophictech.io',  duration: 398,  commitSha: '5f02d17', createdAt: ago(30)   },
    { projectId: 'proj_ai',      version: 'v0.9.3',  branch: 'feat/rag',     status: 'failed',   environment: 'staging',    triggeredBy: 'priya@trophictech.io',  duration: 210,  commitSha: '6a14e28', createdAt: ago(200)  },
    { projectId: 'proj_ai',      version: 'v0.9.2',  branch: 'main',         status: 'success',  environment: 'production', triggeredBy: 'admin@trophictech.io',  duration: 412,  commitSha: '7b25f39', createdAt: ago(1080) },
  ]})

  console.log('Seed complete.')
}

main().catch(err => { console.error(err); process.exit(1) }).finally(() => p.$disconnect())
