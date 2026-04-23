# Trophic Tech — Mission Control

> Internal DevOps dashboard for managing projects, deployments, and CI/CD pipelines across all Trophic Tech client engagements.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [Docker Compose](#docker-compose)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Infrastructure](#infrastructure)
- [Deployment (Helm / AKS)](#deployment-helm--aks)
- [Project Structure](#project-structure)
- [Updating This README](#updating-this-readme)

---

## Overview

Mission Control is a full-stack Next.js 15 application built for Trophic Tech engineers. It provides a real-time view of deployment activity across all client projects, with live metric animations, a searchable command palette, configurable pipeline filters, and one-click deployment triggering.

The app follows a **Dark Mode Apple** design system — glassmorphism surfaces, `#0a84ff` accent, SF Pro font stack — and is deployed to Azure Kubernetes Service via a multi-stage GitHub Actions CI/CD pipeline.

---

## Tech Stack

| Layer          | Technology                                      | Version  |
|----------------|-------------------------------------------------|----------|
| Framework      | Next.js App Router                              | ^15.3.0  |
| UI Library     | React                                           | ^19.0.0  |
| Language       | TypeScript                                      | ^5.6.0   |
| Styling        | Tailwind CSS                                    | ^3.4.15  |
| Icons          | Lucide React                                    | ^0.469.0 |
| Authentication | Auth.js (next-auth v5) — Credentials + JWT      | ^5.0.0   |
| ORM            | Prisma                                          | ^5.22.0  |
| Database       | PostgreSQL (Azure Flexible Server in prod)      | 16       |
| Validation     | Zod                                             | ^3.23.8  |
| Containerisation | Docker (multi-stage BuildKit)                 | —        |
| Orchestration  | Kubernetes / Helm on AKS                        | —        |
| IaC            | Terraform (azurerm ~> 4.0)                     | >= 1.9.0 |
| CI/CD          | GitHub Actions                                  | —        |
| Registry       | Azure Container Registry (ACR)                  | —        |
| Testing        | Jest + Testing Library                          | ^29.7.0  |

---

## Features

### Dashboard
- **Count-up animated metrics** — Total Deployments, Success Rate, Active Projects, Avg Deploy Time all animate from 0 on load using a `requestAnimationFrame` ease-out cubic hook
- **7-day activity chart** — SVG bar chart showing success (green) vs failed (red) deployments per day, with staggered bar entrance animations
- **Auto-refresh** — `router.refresh()` runs every 30 seconds; live indicator dot pulses in the header
- **Row-click detail drawer** — Click any deployment row to open a right-side panel with full metadata and one-click ID copy

### Pipeline
- **Full-text search** — Filters across project name, client, version, branch, and triggered-by in real time
- **Status tabs** — All / Running / Success / Failed / Pending with per-tab counts
- **Environment filter** — All / Staging / Production toggle
- **Sortable columns** — Click any column header (Project, Version, Status, Duration, Time) to sort; click again to reverse
- **Trigger Run modal** — Opens a form to queue a new deployment: project dropdown, branch input, environment radio

### Projects
- **Search + filter tabs** — Filter by All / Active / Maintenance / Archived with live counts
- **Staggered card entrance** — Each card fades in with a 55 ms offset
- **Hover-reveal action** — "Deployments" button appears on hover and navigates to the Pipeline page

### Global
- **Command Palette (`⌘K` / `Ctrl+K`)** — Debounced search across projects and deployments via `/api/search`; arrow-key navigation, Enter to open
- **Notification Bell** — Shows last 8 deployments with a red dot badge on unread running/failed events
- **Toast notifications** — Success / error / info toasts with coloured left bar, auto-dismiss at 4.5 s, stacking up to 5
- **Keyboard shortcuts** — Escape closes all overlays; `⌘K` toggles the command palette from anywhere

### Team
- Roster of all team members with role badges (Admin / Engineer / Viewer), avatar initials, and join date

---

## Prerequisites

| Tool       | Minimum version | Install                              |
|------------|-----------------|--------------------------------------|
| Node.js    | 20.x            | https://nodejs.org                   |
| npm        | 10.x            | Bundled with Node                    |
| PostgreSQL  | 15+             | Local or via Docker Compose          |
| Docker     | 24+             | https://docs.docker.com/get-docker   |
| Terraform  | 1.9+            | https://developer.hashicorp.com/terraform |
| Azure CLI  | 2.60+           | `brew install azure-cli`             |
| Helm       | 3.14+           | `brew install helm`                  |

---

## Local Development

```bash
# 1. Clone and install
git clone <repo-url>
cd trophic-mission-control
npm install

# 2. Copy env template and fill in values
cp .env.example .env.local

# 3. Start Postgres (Docker)
docker compose up postgres -d

# 4. Apply migrations and seed
npm run db:migrate
npm run db:seed

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

**Demo credentials** (seeded automatically):

| Email                    | Password    | Role     |
|--------------------------|-------------|----------|
| admin@trophictech.io     | Admin123!   | admin    |
| engineer@trophictech.io  | Engineer1!  | engineer |

---

## Environment Variables

Create a `.env.local` file at the project root. All variables are required in production; the `DATABASE_URL` and `AUTH_SECRET` must be stored in Azure Key Vault for deployed environments.

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/trophic_mc"

# Auth.js v5
AUTH_SECRET="replace-with-32-char-random-string"
NEXTAUTH_URL="http://localhost:3000"

# (Production — injected from Key Vault via Workload Identity)
# DATABASE_URL  → Key Vault secret: DATABASE-URL
# AUTH_SECRET   → Key Vault secret: AUTH-SECRET
# NEXTAUTH_URL  → Key Vault secret: NEXTAUTH-URL
```

Generate a strong `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Database

### Schema (3 models)

```
User          — id, email, name, password (bcrypt), role, avatar, timestamps
Project       — id, name, client, repo, description, status, tech[], timestamps
Deployment    — id, projectId→Project, version, branch, status, environment,
                triggeredBy, duration?, commitSha?, createdAt
```

### Common commands

```bash
npm run db:migrate    # prisma migrate deploy (apply pending migrations)
npm run db:push       # prisma db push (schema sync — dev only)
npm run db:seed       # seed demo users, projects, and deployments
npm run db:reset      # drop + recreate + seed (dev only)
npx prisma studio     # open Prisma Studio GUI at http://localhost:5555
```

---

## Scripts

| Script                | Description                                          |
|-----------------------|------------------------------------------------------|
| `npm run dev`         | Next.js dev server with Fast Refresh                 |
| `npm run build`       | Production build                                     |
| `npm start`           | Start the production server                          |
| `npm run lint`        | ESLint                                               |
| `npm run lint:sarif`  | ESLint with SARIF output for GitHub Security tab     |
| `npm test`            | Jest (unit tests)                                    |
| `npm run test:coverage` | Jest with coverage report                          |
| `npm run db:migrate`  | Apply Prisma migrations                              |
| `npm run db:seed`     | Seed demo data                                       |
| `npm run db:reset`    | Hard reset DB (dev only)                             |

---

## Docker Compose

The `docker-compose.yml` defines three services:

| Service     | Purpose                                            |
|-------------|----------------------------------------------------|
| `postgres`  | PostgreSQL 16 with healthcheck (`pg_isready`)      |
| `migrate`   | One-shot: `prisma migrate deploy` + `db:seed`      |
| `app`       | Next.js production image on port 3000              |

```bash
# Full stack (build + start)
docker compose up --build

# Just the database
docker compose up postgres -d

# Tear down (keeps volumes)
docker compose down

# Tear down + delete volumes
docker compose down -v
```

The app image is a **3-stage Dockerfile**: `deps` (install) → `builder` (next build) → `runner` (non-root user 1001, standalone output, healthcheck on `/api/health`).

---

## Testing

```bash
npm test                   # run all tests
npm run test:coverage      # with coverage report
```

Tests live in `__tests__/`. The Jest config uses `nextJest` with `jest-environment-jsdom` and a 60% coverage threshold. A Postgres service container is spun up automatically in CI for integration tests.

---

## CI/CD Pipeline

The pipeline is defined in [`.github/workflows/main.yml`](.github/workflows/main.yml) and runs on push to `main`/`develop` and on all PRs targeting `main`.

### Jobs

| # | Job               | What it does                                                                 |
|---|-------------------|------------------------------------------------------------------------------|
| 1 | `security-scan`   | Trivy secret/vuln scan (FS + image), ESLint SARIF → GitHub Security tab     |
| 2 | `test`            | Jest with Postgres service container, Codecov upload                         |
| 3 | `build-push`      | BuildKit → ACR, image Trivy scan, SBOM upload                               |
| 4 | `deploy-staging`  | `helm upgrade --atomic` to staging namespace, smoke test on `/api/health`   |
| 5 | `approval-gate`   | GitHub Environment required reviewer pause                                   |
| 6 | `deploy-production` | Canary 20% → 90 s soak → full rollout → health check → auto `helm rollback` on failure → Slack notification |

### Required Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret                | Description                              |
|-----------------------|------------------------------------------|
| `ACR_REGISTRY`        | ACR login server (e.g. `trophic.azurecr.io`) |
| `ACR_REPOSITORY`      | Image name (e.g. `mission-control`)      |
| `AKS_CLUSTER`         | AKS cluster name                         |
| `AKS_RESOURCE_GROUP`  | Azure resource group                     |
| `AZURE_CLIENT_ID`     | Service principal / OIDC app client ID   |
| `AZURE_TENANT_ID`     | Azure tenant ID                          |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID                  |
| `HELM_RELEASE`        | Helm release name                        |
| `SLACK_WEBHOOK_URL`   | Slack incoming webhook for deploy alerts |
| `CODECOV_TOKEN`       | Codecov upload token                     |

---

## Infrastructure

Terraform modules live in [`infrastructure/terraform/`](infrastructure/terraform/). All modules target `azurerm ~> 4.0`.

### Modules

| Module        | Resources                                                              |
|---------------|------------------------------------------------------------------------|
| `networking`  | VNet, 4 subnets (AKS, DB, PE, app), NSGs, PostgreSQL delegation       |
| `aks`         | AKS cluster, system + app node pools, OIDC issuer, Workload Identity, Key Vault CSI driver, patch auto-upgrade |
| `acr`         | Azure Container Registry (private, admin disabled), private endpoint, private DNS zone |
| `database`    | PostgreSQL Flexible Server v16, zone-redundant HA (prod), TLS 1.2, `prevent_destroy` lifecycle |
| `keyvault`    | Key Vault with RBAC auth, 3 secrets, role assignments for deployer + AKS workload identity |
| `monitoring`  | Log Analytics, ContainerInsights, action group, 4 metric alerts (CPU, memory, pods-not-ready, PG CPU) |

### Environments

```bash
# Staging
cd infrastructure/terraform/environments/staging
terraform init && terraform apply

# Production
cd infrastructure/terraform/environments/production
terraform init && terraform apply
```

**Staging** — cost-optimised: `B_Standard_B1ms` DB, no HA, 1 system node, ACR Basic SKU, public AKS cluster.  
**Production** — HA DB, geo-redundant backup, private AKS cluster, 90-day log retention, up to 10 app nodes.

---

## Deployment (Helm / AKS)

The Helm chart lives in [`helm/app/`](helm/app/).

### Key values

| Value                  | Default                              | Description                         |
|------------------------|--------------------------------------|-------------------------------------|
| `image.repository`     | `trophictech.azurecr.io/mission-control` | ACR image path                  |
| `image.tag`            | `latest`                             | Overridden by CI with commit SHA    |
| `replicaCount`         | `3`                                  | Pod replicas                        |
| `existingSecret`       | `trophic-mc-secrets`                 | K8s Secret with DATABASE_URL etc.   |
| `ingress.host`         | `app.trophictech.io`                 | Public hostname                     |
| `hpa.minReplicas`      | `3`                                  | HPA lower bound                     |
| `hpa.maxReplicas`      | `10`                                 | HPA upper bound                     |
| `ingress.canary.enabled` | `false`                            | Toggle canary ingress in CI         |

### Manual deploy

```bash
# Authenticate
az aks get-credentials --resource-group <rg> --name <cluster>

# Deploy / upgrade
helm upgrade --install trophic-app ./helm/app \
  --namespace production \
  --set image.tag=<sha> \
  --atomic --timeout 5m

# Rollback
helm rollback trophic-app --namespace production
```

The HPA scales on CPU ≥ 70% and memory ≥ 80%, with a 300 s scale-down stabilisation window.

---

## Project Structure

```
trophic-mission-control/
├── .github/workflows/        # CI/CD pipeline
│   └── main.yml
├── __tests__/                # Jest unit tests
├── app/
│   ├── (auth)/login/         # Login page (Credentials auth)
│   ├── (dashboard)/          # Protected route group
│   │   ├── layout.tsx        # Sidebar + Topbar + Providers
│   │   ├── page.tsx          # Dashboard (metrics, chart, deployments)
│   │   ├── pipeline/         # Pipeline table with search/filter/sort
│   │   ├── projects/         # Project cards with filter
│   │   └── team/             # Team roster
│   ├── api/
│   │   ├── auth/             # Auth.js handler
│   │   ├── deployments/      # GET list, POST trigger
│   │   ├── health/           # GET /api/health (liveness probe)
│   │   ├── projects/         # GET list
│   │   └── search/           # GET /api/search?q= (command palette)
│   ├── globals.css           # Tailwind + keyframes + CSS variables
│   └── layout.tsx            # Root layout
├── components/
│   ├── dashboard/            # DashboardShell, MetricsGrid, ActivityChart,
│   │                         # DeploymentsTable, PipelineStages
│   ├── layout/               # Sidebar, Topbar, NotificationBell
│   ├── pipeline/             # PipelineShell, TriggerModal
│   ├── projects/             # ProjectsShell
│   ├── providers.tsx         # ToastProvider + CommandPalette
│   └── ui/                   # CommandPalette, Modal, Drawer, Toast
├── helm/app/                 # Helm chart (deployment, service, ingress, hpa)
├── hooks/                    # useCountUp, useKeyboard
├── infrastructure/terraform/ # Terraform modules + environments
├── lib/                      # prisma.ts, utils.ts
├── prisma/                   # schema.prisma, seed.ts, migrations/
├── types/                    # index.ts (shared types), next-auth.d.ts
├── auth.ts                   # Auth.js v5 config
├── middleware.ts             # Route protection (JWT check)
├── Dockerfile                # Multi-stage production image
└── docker-compose.yml        # Local dev: postgres + migrate + app
```

---

## Updating This README

This README is structured so each section maps to a discrete part of the stack. When making changes, update only the affected section:

| Changed area                          | Section to update                     |
|---------------------------------------|---------------------------------------|
| New npm dependency                    | Tech Stack table                      |
| New dashboard feature or page         | Features                              |
| New environment variable              | Environment Variables                 |
| New npm script                        | Scripts table                         |
| New Terraform module                  | Infrastructure → Modules table        |
| New GitHub Actions job or secret      | CI/CD Pipeline                        |
| New Helm value                        | Deployment → Key values table         |
| New top-level directory or major file | Project Structure                     |
| Dependency version bump               | Tech Stack → Version column           |

To regenerate the project structure tree from the terminal:

```bash
# Install tree if needed: brew install tree (macOS) / apt install tree (Linux)
tree -I "node_modules|.next|.git|coverage|dist" --dirsfirst -a
```
