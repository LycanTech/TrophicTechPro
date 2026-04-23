# ─── Monitoring Module ──────────────────────────────────────────────────────────
#
# Provisions:
#   - Log Analytics Workspace (centralised log sink for AKS, ACR, PostgreSQL)
#   - Container Insights solution (OMS-based AKS node + pod telemetry)
#   - Action group (email + optional webhook/Slack for alert routing)
#   - Metric alerts:
#       • AKS node CPU    > 80% for 15 min  → P2
#       • AKS node memory > 85% for 15 min  → P2
#       • AKS pod not-ready count > 0 for 5 min → P1
#       • PostgreSQL CPU  > 80% for 10 min  → P2

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.name_prefix}-law"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_in_days

  tags = var.tags
}

# Container Insights solution — enables node/pod-level metrics in Azure Monitor
resource "azurerm_log_analytics_solution" "container_insights" {
  solution_name         = "ContainerInsights"
  location              = var.location
  resource_group_name   = var.resource_group_name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/ContainerInsights"
  }

  tags = var.tags
}

# ─── Action group (alert routing) ─────────────────────────────────────────────
resource "azurerm_monitor_action_group" "ops" {
  name                = "${var.name_prefix}-ag-ops"
  resource_group_name = var.resource_group_name
  short_name          = "zingy-ops"

  dynamic "email_receiver" {
    for_each = var.alert_email != "" ? [var.alert_email] : []
    content {
      name                    = "ops-email"
      email_address           = email_receiver.value
      use_common_alert_schema = true
    }
  }

  dynamic "webhook_receiver" {
    for_each = var.alert_webhook_url != "" ? [var.alert_webhook_url] : []
    content {
      name                    = "slack-webhook"
      service_uri             = webhook_receiver.value
      use_common_alert_schema = true
    }
  }

  tags = var.tags
}

# ─── AKS alerts ───────────────────────────────────────────────────────────────
resource "azurerm_monitor_metric_alert" "aks_cpu_high" {
  count = var.aks_cluster_id != "" ? 1 : 0

  name                = "${var.name_prefix}-alert-aks-cpu"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "AKS node CPU sustained above 80% — investigate autoscaler or add nodes"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "aks_memory_high" {
  count = var.aks_cluster_id != "" ? 1 : 0

  name                = "${var.name_prefix}-alert-aks-memory"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "AKS node memory above 85% — risk of OOMKill on pods"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_memory_working_set_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "aks_pods_not_ready" {
  count = var.aks_cluster_id != "" ? 1 : 0

  name                = "${var.name_prefix}-alert-aks-pods-not-ready"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Pods in NotReady state — deployment failure or image pull error"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "kube_pod_status_not_ready"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 0
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }

  tags = var.tags
}

# ─── PostgreSQL alert ─────────────────────────────────────────────────────────
resource "azurerm_monitor_metric_alert" "pg_cpu_high" {
  count = var.postgresql_server_id != "" ? 1 : 0

  name                = "${var.name_prefix}-alert-pg-cpu"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgresql_server_id]
  description         = "PostgreSQL CPU above 80% — query optimisation or scale-up needed"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT10M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }

  tags = var.tags
}
