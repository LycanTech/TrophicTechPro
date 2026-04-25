# ─── AKS Module ─────────────────────────────────────────────────────────────────
#
# Provisions:
#   - AKS cluster (Azure CNI, Azure Network Policy, RBAC)
#   - System node pool  — reserved for control-plane addons (CoreDNS, kube-proxy)
#   - App user node pool — autoscales 2→max for workload pods
#   - OIDC issuer + Workload Identity (eliminates long-lived credential files)
#   - Key Vault secrets provider addon (CSI driver, auto-rotation every 2 min)
#   - OMS agent → Log Analytics (Container Insights)
#   - Diagnostic settings for API server, audit, controller manager, scheduler logs

data "azurerm_client_config" "current" {}

resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.name_prefix}-aks"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.name_prefix
  kubernetes_version  = var.kubernetes_version

  # ── System-assigned managed identity — no service principals or client secrets ──
  identity {
    type = "SystemAssigned"
  }

  # ── System node pool (reserved for add-ons — no app workloads run here) ────────
  default_node_pool {
    name                         = "system"
    node_count                   = var.system_node_count
    vm_size                      = var.system_node_vm_size
    vnet_subnet_id               = var.aks_system_subnet_id
    os_disk_size_gb              = 128
    only_critical_addons_enabled = true   # taints this pool: CriticalAddonsOnly=true
    temporary_name_for_rotation  = "systemtmp"

    upgrade_settings {
      max_surge = "33%"
    }
  }

  # ── Networking — Azure CNI with Azure Network Policy ──────────────────────────
  # Azure CNI assigns real VNet IPs to pods (visible in VNet, no NAT).
  # Azure Network Policy enforces Kubernetes NetworkPolicy objects in kernel.
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    service_cidr      = var.service_cidr
    dns_service_ip    = var.dns_service_ip
    load_balancer_sku = "standard"
  }

  # ── OIDC issuer + Workload Identity ───────────────────────────────────────────
  # Pods exchange a signed Kubernetes service account JWT for a short-lived
  # Azure AD token — no credential files, no Managed Identity per pod.
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # ── Key Vault secrets — CSI driver with rotation ──────────────────────────────
  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  # ── Container Insights (OMS agent → Log Analytics) ────────────────────────────
  oms_agent {
    log_analytics_workspace_id      = var.log_analytics_workspace_id
    msi_auth_for_monitoring_enabled = true
  }

  # ── Azure AD RBAC (Kubernetes RBAC backed by Azure AD) ────────────────────────
  azure_active_directory_role_based_access_control {
    azure_rbac_enabled = true
    tenant_id          = data.azurerm_client_config.current.tenant_id
  }

  # ── Private cluster (optional — enable in production for zero public API exposure) ─
  private_cluster_enabled = var.private_cluster_enabled

  # ── Auto-upgrade — patch channel, maintenance window Sunday 02:00 UTC ──────────
  automatic_upgrade_channel = "patch"

  maintenance_window_auto_upgrade {
    frequency   = "Weekly"
    interval    = 1
    duration    = 4
    day_of_week = "Sunday"
    start_time  = "02:00"
    utc_offset  = "+00:00"
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,   # managed by cluster autoscaler
      kubernetes_version,                 # managed by automatic_upgrade_channel
    ]
  }
}

# ─── App (user) node pool — autoscaled for workload pods ──────────────────────
resource "azurerm_kubernetes_cluster_node_pool" "app" {
  name                  = "apppool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.app_node_vm_size
  vnet_subnet_id        = var.aks_app_subnet_id
  os_disk_size_gb       = 128
  mode                  = "User"

  auto_scaling_enabled = true
  min_count            = var.app_node_min_count
  max_count            = var.app_node_max_count

  node_labels = {
    "trophictech.io/pool" = "app"
  }

  # max_surge = "0" + max_unavailable = 1 avoids creating extra nodes during upgrades,
  # which matters on subscriptions with tight vCPU quota.
  upgrade_settings {
    max_surge       = "0"
    max_unavailable = 1
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [node_count]   # managed by cluster autoscaler
  }
}

# ─── Diagnostic settings — AKS control-plane logs → Log Analytics ─────────────
# Captures API server audit trail, scheduler, controller decisions.
# Essential for security forensics and compliance reviews.
resource "azurerm_monitor_diagnostic_setting" "aks" {
  name                       = "${var.name_prefix}-aks-diag"
  target_resource_id         = azurerm_kubernetes_cluster.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log { category = "kube-apiserver" }
  enabled_log { category = "kube-audit" }
  enabled_log { category = "kube-audit-admin" }
  enabled_log { category = "kube-controller-manager" }
  enabled_log { category = "kube-scheduler" }
  enabled_log { category = "guard" }
}
