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

## Live URLs

| Service | URL | Credentials |
| --- | --- | --- |
| **Mission Control app** | <http://app.68.220.239.81.nip.io> | `chikwex@trophictech.io` / `demo1234` |
| **Grafana monitoring** | <http://grafana.app.68.220.239.81.nip.io> | `admin` / `trophic2024` |

Both services are served over HTTP (TLS not yet configured) from the nginx-ingress LoadBalancer on AKS at `68.220.239.81`.

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

| Email                          | Password   | Role     |
|--------------------------------|------------|----------|
| `chikwex@trophictech.io`       | `demo1234` | admin    |
| `admin@trophictech.io`         | `demo1234` | admin    |
| `jamie@trophictech.io`         | `demo1234` | engineer |
| `priya@trophictech.io`         | `demo1234` | engineer |
| `client@nordstrom.com`         | `demo1234` | viewer   |

---

## Environment Variables

Create a `.env.local` file at the project root. All variables are required in production; the `DATABASE_URL` and `AUTH_SECRET` must be stored in Azure Key Vault for deployed environments.

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/trophic_mc"

# Auth.js v5
AUTH_SECRET="replace-with-32-char-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Required for Auth.js behind a reverse proxy / load balancer
AUTH_TRUST_HOST=true

# (Production — injected by the CI/CD workflow from Azure Key Vault)
# DATABASE_URL  → trophic-staging-kv: DATABASE-URL
# AUTH_SECRET   → trophic-prod-kv:    AUTH-SECRET
# NEXTAUTH_URL  → hardcoded in workflow to http://app.68.220.239.81.nip.io
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

The pipeline is defined in [`.github/workflows/main.yml`](.github/workflows/main.yml) and follows a **two-branch model** that mirrors a real production promotion flow.

### Branch strategy

```text
feature/* ──► staging (push) ──► Jobs 1–4 only (Security → Tests → Build → Deploy Staging)
                                      │
                              PR merge to main
                                      │
                                      ▼
                             main (push) ──► Jobs 1–6 (full pipeline, including Approval Gate → Production)
```

- Merging a PR from `staging` → `main` is the gate that triggers the full production pipeline.
- `workflow_dispatch` can trigger any job manually on either branch from the Actions tab.

### Jobs

| # | Job | Runs on | What it does |
| --- | --- | --- | --- |
| 1 | `security-scan` | every push / PR | ESLint SARIF → GitHub Security tab; Trivy FS secret + vuln scan |
| 2 | `test` | every push / PR | Jest with Postgres 16 service container; Codecov upload |
| 3 | `build-push` | `main` or `staging` push | BuildKit → ACR (sha tag + `latest` on `main`); Trivy image scan + SBOM |
| 4 | `deploy-staging` | after `build-push` | Pulls KV secrets → K8s Secret; runs Prisma `migrate deploy` as a K8s Job; `helm upgrade --atomic --timeout 10m` to `staging` namespace; smoke test on `/api/health` |
| 5 | `approval-gate` | `main` only | Pauses pipeline at the `production-approval` GitHub Environment — a required reviewer must approve |
| 6 | `deploy-production` | `main` only, after approval | Checks PostgreSQL is `Ready` (auto-starts if `Stopped`); pulls KV secrets; runs Prisma migrations; canary deploy (20% weight, 1 replica, 30 s soak) → full rollout (3 replicas) → canary cleanup; Slack success/failure notification |

### Database migrations

Both staging and production runs execute Prisma migrations as a Kubernetes `batch/v1 Job` **before** every Helm deploy. The job uses the same Docker image being deployed and runs:

```sh
node node_modules/prisma/build/index.js migrate deploy
```

The workflow polls the job every 10 s and streams pod logs to the run output on failure. `ttlSecondsAfterFinished: 300` cleans up completed jobs automatically.

### GitHub Environments

Create these three environments in **Settings → Environments**:

| Environment | Protection rules |
| --- | --- |
| `staging` | None required |
| `production-approval` | **Required reviewer(s)** — this is the manual approval gate |
| `production` | None (guarded by the `approval-gate` job dependency) |

### Required Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
| --- | --- |
| `AZURE_CLIENT_ID` | OIDC federated identity client ID (used by `azure/login@v2`) |
| `AZURE_TENANT_ID` | Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `ACR_REGISTRY` | ACR login server — e.g. `trophictech.azurecr.io` |
| `ACR_REPOSITORY` | Image name — e.g. `mission-control` |
| `AKS_CLUSTER` | AKS cluster name |
| `AKS_RESOURCE_GROUP` | Resource group containing the AKS cluster |
| `HELM_RELEASE` | Helm release base name — e.g. `trophic-app` |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for deploy success/failure alerts |
| `CODECOV_TOKEN` | Codecov upload token |

> **Note:** Azure authentication uses OIDC (`id-token: write`), not a service-principal JSON blob. No `ACR_PASSWORD` or `AZURE_CREDENTIALS` secret is needed.
>
> Key Vault names (`trophic-staging-kv` / `trophic-prod-kv`) are hardcoded in the workflow and provisioned by Terraform — they do not need to be GitHub secrets.

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

## Monitoring & Observability

| Tool          | URL                                       | Credentials             |
|---------------|-------------------------------------------|-------------------------|
| Grafana       | <http://grafana.app.68.220.239.81.nip.io> | `admin` / `trophic2024` |
| Azure Monitor | Azure Portal → Monitor                    | Azure RBAC              |

Grafana is deployed via Helm to the `monitoring` namespace on the same AKS cluster.

### Data sources configured

| Name          | Type                                | What it shows                                               |
|---------------|-------------------------------------|-------------------------------------------------------------|
| Azure Monitor | `grafana-azure-monitor-datasource`  | AKS CPU/memory/pod-ready, PostgreSQL CPU, Log Analytics KQL |
| TestData      | `grafana-testdata-datasource`       | Synthetic data for building and testing panels              |

The `grafana-reader` service principal has **Monitoring Reader** (subscription-scope) and **Log Analytics Reader** (workspace-scope) — read-only access. Log Analytics workspace: `trophic-staging-law` (resource group `trophic-staging-rg`).

### Azure Monitor alerts (Terraform-managed)

| Alert              | Threshold         | Severity |
|--------------------|-------------------|----------|
| AKS node CPU       | > 80% for 15 min  | P2       |
| AKS node memory    | > 85% for 15 min  | P2       |
| AKS pods not ready | > 0 for 5 min     | P1       |
| PostgreSQL CPU     | > 80% for 10 min  | P2       |

---

## Deployment (Helm / AKS)

The Helm chart lives in [`helm/app/`](helm/app/).

### Key values

| Value                      | Default                                    | Description                      |
|----------------------------|--------------------------------------------|----------------------------------|
| `image.repository`         | `trophictech.azurecr.io/mission-control`   | ACR image path                   |
| `image.tag`                | `latest`                                   | Overridden by CI with commit SHA |
| `replicaCount`             | `1`                                        | Pod replicas                     |
| `existingSecret`           | `trophic-mc-secrets`                       | K8s Secret with DATABASE_URL     |
| `ingress.host`             | `app.68.220.239.81.nip.io`                 | Public hostname                  |
| `autoscaling.enabled`      | `false`                                    | HPA on/off                       |
| `autoscaling.minReplicas`  | `1`                                        | HPA lower bound                  |
| `autoscaling.maxReplicas`  | `3`                                        | HPA upper bound                  |
| `ingress.canary.enabled`   | `false`                                    | Toggle canary ingress in CI      |

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
