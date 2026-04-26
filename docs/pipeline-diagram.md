# Trophic Tech — CI/CD Pipeline Architecture

## Branch Strategy

```text
feature/* ──► staging (push) ──► Jobs 1–4  (Security → Tests → Build → Deploy Staging)
                                      │
                              PR merge to main
                                      │
                                      ▼
                       main (push) ──► Jobs 1–6 (+ Approval Gate → Deploy Production)
```

Pushing to `staging` runs the full CI suite and deploys to the staging namespace.
Merging a PR from `staging` → `main` triggers the complete pipeline through to production.

## End-to-End Flow: Code Push → AKS Production

```mermaid
graph TD
    A([👨‍💻 Developer Push\nstaging branch]) -->|webhook trigger| B

    subgraph CI ["⚙️ Continuous Integration"]
        B[GitHub Actions\nWorkflow Trigger]
        B --> C{🔍 Security Scan\nTrivy · secret detection}
        C -->|pass| D[🧪 Unit & Integration Tests\nJest · Postgres 16 service]
        C -->|fail — continue| ERR1[⚠️ SARIF findings\n→ GitHub Security tab]
        D -->|pass| E[🐳 Docker Build\nBuildKit · layer cache]
        D -->|fail — block| ERR2[❌ PR Blocked\nTest failure]
        E --> F[🔎 Image Vulnerability Scan\nTrivy · SARIF → GitHub Security]
        F -->|clean| G[📦 Push to Azure\nContainer Registry]
        F -->|CVE found — continue| G
    end

    subgraph CD ["🚀 Continuous Deployment"]
        G --> H[🔑 Pull KV Secrets\n→ K8s Secret]
        H --> I[🗄️ Prisma Migrations\nbatch/v1 Job · polling loop]
        I -->|complete| J[🟡 Staging Deployment\nHelm atomic · 10m timeout\nreplicas: 2]
        I -->|failed| ERR3[❌ Migration failed\npod logs streamed to run]
        J --> K[🩺 Smoke Test\n/api/health endpoint]
        K -->|main branch only| L{🔐 Manual Approval Gate\nGitHub Environment Review\nRequired Reviewer}
        K -->|staging branch| END2([✅ Staging deploy complete])
        L -->|approved| M[🐦 Canary Deployment\n20% traffic · 1 replica · 30s soak\nAKS prod ns]
        L -->|rejected| END1([🛑 Pipeline Halted])
        M -->|healthy| N[🗄️ Prisma Migrations\nproduction namespace]
        N -->|complete| O[🟢 Full Production Rollout\nHelm atomic · 3 replicas · 10m]
        O --> P[🧹 Canary Cleanup\nHelm uninstall canary]
        P --> Q{✅ Production\nHealth Check\n/api/health · HTTP 200}
        Q -->|pass| R([🎉 Deployment Complete\nhttps://app.trophictech.io])
        Q -->|fail — continue| R
    end

    subgraph OBS ["📡 Observability"]
        R --> S[📊 Azure Monitor\nAKS metrics · alerts]
        R --> T[💬 Slack Notification\nDeploy success/failure]
    end

    style A fill:#1c1c1e,stroke:#0a84ff,stroke-width:2px,color:#fff
    style B fill:#2c2c2e,stroke:#636366,color:#fff
    style CI fill:#111,stroke:#3a3a3c,color:#fff
    style CD fill:#0d0d0f,stroke:#3a3a3c,color:#fff
    style OBS fill:#0a0a0c,stroke:#3a3a3c,color:#fff
    style G fill:#0a84ff,stroke:#fff,stroke-width:2px,color:#fff
    style O fill:#30d158,stroke:#fff,stroke-width:2px,color:#000
    style R fill:#30d158,stroke:#fff,stroke-width:2px,color:#000
    style L fill:#ff9f0a,stroke:#fff,stroke-width:2px,color:#000
    style ERR1 fill:#636366,stroke:#fff,color:#fff
    style ERR2 fill:#ff453a,stroke:#fff,color:#fff
    style ERR3 fill:#ff453a,stroke:#fff,color:#fff
```

## Pipeline Stage Summary

| Stage | Tool | SLA Target | On Failure |
| --- | --- | --- | --- |
| Security Scan | Trivy (fs) + ESLint | < 2 min | SARIF to Security tab (non-blocking) |
| Unit Tests | Jest + Postgres 16 | < 5 min | Block build |
| Docker Build | BuildKit (cached) | < 3 min | Block build |
| Image Scan | Trivy (image) | < 2 min | SARIF to Security tab (non-blocking) |
| Push to ACR | Docker push | < 2 min | Block pipeline |
| DB Migration (staging) | Prisma K8s Job | < 4 min | Fail with pod logs |
| Staging Deploy | Helm atomic | < 10 min | `--atomic` auto-rollback |
| Smoke Test | curl /api/health | < 1 min | Non-blocking (DNS/ingress optional) |
| Approval Gate | GitHub Env Review | Manual | Halt pipeline |
| PostgreSQL check | az postgres show | < 5 min | Fail if not Ready |
| DB Migration (prod) | Prisma K8s Job | < 4 min | Fail with pod logs |
| Canary (20%) | Helm + NGINX | 30 s soak | `--atomic` auto-rollback |
| Prod Deploy | Helm atomic | < 10 min | `--atomic` auto-rollback |
| Health Check | curl /api/health | < 1 min | Non-blocking (DNS/ingress optional) |
| Slack Notify | Slack webhook | < 10 s | Non-blocking |

## Required GitHub Secrets

```text
AZURE_CLIENT_ID          # OIDC federated identity client ID
AZURE_TENANT_ID          # Azure tenant ID
AZURE_SUBSCRIPTION_ID    # Azure subscription ID
ACR_REGISTRY             # e.g. trophictech.azurecr.io
ACR_REPOSITORY           # e.g. mission-control
AKS_CLUSTER              # AKS cluster name
AKS_RESOURCE_GROUP       # Resource group containing the AKS cluster
HELM_RELEASE             # Helm release base name — e.g. trophic-app
SLACK_WEBHOOK_URL         # Slack incoming webhook
CODECOV_TOKEN            # Codecov upload token
```

> Authentication uses OIDC — no `ACR_PASSWORD` or `AZURE_CREDENTIALS` blob needed.
> Key Vault names (`trophic-staging-kv` / `trophic-prod-kv`) are provisioned by Terraform
> and hardcoded in the workflow — they are not GitHub secrets.

## GitHub Environment Configuration

Create three environments in **Settings → Environments**:

| Environment | Protection Rules |
| --- | --- |
| `staging` | None required |
| `production-approval` | Required reviewer(s) — acts as approval gate |
| `production` | None (guarded by `approval-gate` job dependency) |
