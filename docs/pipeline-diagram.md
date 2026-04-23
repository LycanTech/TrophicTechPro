# Trophic Tech — CI/CD Pipeline Architecture

## End-to-End Flow: Code Push → AKS Production

```mermaid
graph TD
    A([👨‍💻 Developer Push\nfeature branch / main]) -->|webhook trigger| B

    subgraph CI ["⚙️ Continuous Integration"]
        B[GitHub Actions\nWorkflow Trigger]
        B --> C{🔍 Security Scan\nTrivy · secret detection}
        C -->|pass| D[🧪 Unit & Integration Tests\nJest · coverage report]
        C -->|fail — block| ERR1[❌ PR Blocked\nSecurity violation]
        D -->|pass| E[🐳 Docker Build\nBuildKit · layer cache]
        D -->|fail — block| ERR2[❌ PR Blocked\nTest failure]
        E --> F[🔎 Image Vulnerability Scan\nTrivy · SARIF → GitHub Security]
        F -->|clean| G[📦 Push to Azure\nContainer Registry]
        F -->|critical CVE| ERR3[❌ Build Blocked\nCVE threshold exceeded]
    end

    subgraph CD ["🚀 Continuous Deployment"]
        G --> H[🟡 Staging Deployment\nHelm · AKS staging ns\nreplicas: 2]
        H --> I[🩺 Smoke Tests\n/healthz endpoint check]
        I -->|pass| J{🔐 Manual Approval Gate\nGitHub Environment Review\nRequired Reviewer}
        I -->|fail| ERR4[🔄 Auto-rollback\nHelm rollback staging]
        J -->|approved| K[🐦 Canary Deployment\n20% traffic · 90s observation\nAKS prod ns]
        J -->|rejected| END1([🛑 Pipeline Halted])
        K -->|healthy| L[🟢 Full Production Rollout\nHelm · AKS prod ns\nreplicas: 3]
        K -->|degraded| ERR5[🔄 Canary Rollback\nHelm uninstall canary]
        L --> M{✅ Production\nHealth Check\n/healthz · HTTP 200}
        M -->|pass| N([🎉 Deployment Complete\nhttps://app.trophictech.io])
        M -->|fail| O[🔄 Automatic Rollback\nHelm rollback prod → N-1]
    end

    subgraph OBS ["📡 Observability"]
        N --> P[📊 Azure Monitor\nAKS metrics · alerts]
        N --> Q[💬 Slack Notification\nDeploy success/failure]
        O --> Q
    end

    style A fill:#1c1c1e,stroke:#0a84ff,stroke-width:2px,color:#fff
    style B fill:#2c2c2e,stroke:#636366,color:#fff
    style CI fill:#111,stroke:#3a3a3c,color:#fff
    style CD fill:#0d0d0f,stroke:#3a3a3c,color:#fff
    style OBS fill:#0a0a0c,stroke:#3a3a3c,color:#fff
    style G fill:#0a84ff,stroke:#fff,stroke-width:2px,color:#fff
    style L fill:#30d158,stroke:#fff,stroke-width:2px,color:#000
    style N fill:#30d158,stroke:#fff,stroke-width:2px,color:#000
    style J fill:#ff9f0a,stroke:#fff,stroke-width:2px,color:#000
    style ERR1 fill:#ff453a,stroke:#fff,color:#fff
    style ERR2 fill:#ff453a,stroke:#fff,color:#fff
    style ERR3 fill:#ff453a,stroke:#fff,color:#fff
    style ERR4 fill:#ff9f0a,stroke:#fff,color:#000
    style ERR5 fill:#ff9f0a,stroke:#fff,color:#000
    style O fill:#ff9f0a,stroke:#fff,color:#000
```

## Pipeline Stage Summary

| Stage | Tool | SLA Target | Failure Mode |
|---|---|---|---|
| Security Scan | Trivy (fs) | < 2 min | Block PR |
| Lint | ESLint | < 1 min | Block PR |
| Unit Tests | Jest + Coverage | < 5 min | Block PR |
| Docker Build | BuildKit (cached) | < 3 min | Block build |
| Image Scan | Trivy (image) | < 2 min | Block push |
| Push to ACR | Docker push | < 2 min | Retry ×3 |
| Staging Deploy | Helm (atomic) | < 5 min | Auto-rollback |
| Smoke Test | curl /healthz | < 1 min | Auto-rollback |
| Approval Gate | GitHub Env Review | Manual | Halt pipeline |
| Canary (20%) | Helm + NGINX | 90s window | Rollback canary |
| Prod Deploy | Helm (atomic) | < 10 min | Auto-rollback |
| Health Check | curl /healthz | < 1 min | Helm rollback N-1 |

## Required GitHub Secrets

```
ACR_REGISTRY           # e.g. trophictech.azurecr.io
ACR_REPOSITORY         # e.g. app-name
ACR_USERNAME           # ACR service principal client ID
ACR_PASSWORD           # ACR service principal secret
AKS_CLUSTER            # AKS cluster name
AKS_RESOURCE_GROUP     # Azure resource group name
HELM_RELEASE           # Helm release name
AZURE_CREDENTIALS      # JSON blob from: az ad sp create-for-rbac
CODECOV_TOKEN          # Codecov upload token
SLACK_WEBHOOK_URL      # Slack incoming webhook
```

## GitHub Environment Configuration

Create three environments in **Settings → Environments**:

| Environment | Protection Rules |
|---|---|
| `staging` | No reviewers required |
| `production-approval` | Required reviewer(s) — acts as approval gate |
| `production` | No additional rules (guarded by approval-gate job dependency) |
