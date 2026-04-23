# ─── ACR Module ─────────────────────────────────────────────────────────────────
#
# Provisions:
#   - Azure Container Registry (Premium — enables private endpoint + geo-replication)
#   - Private endpoint in the private-endpoints subnet (no public registry access)
#   - Private DNS zone  (privatelink.azurecr.io) linked to the VNet
#   - Optional geo-replication to a secondary region
#
# Note: Admin access is disabled. AKS pulls images using its kubelet managed
# identity (AcrPull role assigned in the root environment module).

resource "azurerm_container_registry" "main" {
  name                          = "${replace(var.name_prefix, "-", "")}acr"   # ACR names: alphanumeric only
  resource_group_name           = var.resource_group_name
  location                      = var.location
  sku                           = var.sku
  admin_enabled                 = false   # kubelet identity pulls via AcrPull role; no admin creds needed
  public_network_access_enabled = false   # all traffic flows through private endpoint

  dynamic "georeplications" {
    for_each = var.georeplication_locations
    content {
      location                = georeplications.value
      zone_redundancy_enabled = true
      tags                    = var.tags
    }
  }

  network_rule_bypass_option = "AzureServices"

  tags = var.tags
}

# ─── Private DNS zone ──────────────────────────────────────────────────────────
# Resolves <registry>.azurecr.io to the private endpoint IP inside the VNet.
resource "azurerm_private_dns_zone" "acr" {
  name                = "privatelink.azurecr.io"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "acr" {
  name                  = "${var.name_prefix}-acr-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.acr.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.tags
}

# ─── Private endpoint ──────────────────────────────────────────────────────────
resource "azurerm_private_endpoint" "acr" {
  name                = "${var.name_prefix}-pe-acr"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.name_prefix}-psc-acr"
    private_connection_resource_id = azurerm_container_registry.main.id
    subresource_names              = ["registry"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "acr-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.acr.id]
  }

  tags = var.tags
}

# ─── Diagnostic settings — push registry metrics to Log Analytics ─────────────
resource "azurerm_monitor_diagnostic_setting" "acr" {
  count = var.log_analytics_workspace_id != "" ? 1 : 0

  name                       = "${var.name_prefix}-acr-diag"
  target_resource_id         = azurerm_container_registry.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log { category = "ContainerRegistryRepositoryEvents" }
  enabled_log { category = "ContainerRegistryLoginEvents" }

  metric {
    category = "AllMetrics"
  }
}
