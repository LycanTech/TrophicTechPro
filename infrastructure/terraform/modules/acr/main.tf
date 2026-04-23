# ─── ACR Module ──────────────────────────────────────────────────────────────
#
# Provisions:
#   - Azure Container Registry
#   - Private endpoint + DNS zone (conditional — requires Standard or Premium SKU)
#   - Optional geo-replication (Premium only)
#
# Admin access is always disabled. AKS pulls images via kubelet managed identity
# (AcrPull role assigned in the root environment module).

resource "azurerm_container_registry" "main" {
  name                          = "${replace(var.name_prefix, "-", "")}acr"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  sku                           = var.sku
  admin_enabled                 = false
  public_network_access_enabled = var.public_network_access_enabled

  dynamic "georeplications" {
    for_each = var.georeplication_locations
    content {
      location                = georeplications.value
      zone_redundancy_enabled = true
      tags                    = var.tags
    }
  }

  network_rule_bypass_option = "AzureServices"
  tags                       = var.tags
}

# ─── Private DNS zone ────────────────────────────────────────────────────────
# Only created when private endpoint is enabled (Standard or Premium SKU).

resource "azurerm_private_dns_zone" "acr" {
  count = var.enable_private_endpoint ? 1 : 0

  name                = "privatelink.azurecr.io"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "acr" {
  count = var.enable_private_endpoint ? 1 : 0

  name                  = "${var.name_prefix}-acr-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.acr[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.tags
}

# ─── Private endpoint ────────────────────────────────────────────────────────

resource "azurerm_private_endpoint" "acr" {
  count = var.enable_private_endpoint ? 1 : 0

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
    private_dns_zone_ids = [azurerm_private_dns_zone.acr[0].id]
  }

  tags = var.tags
}

# ─── Diagnostic settings ─────────────────────────────────────────────────────

resource "azurerm_monitor_diagnostic_setting" "acr" {
  count = var.log_analytics_workspace_id != "" ? 1 : 0

  name                       = "${var.name_prefix}-acr-diag"
  target_resource_id         = azurerm_container_registry.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log { category = "ContainerRegistryRepositoryEvents" }
  enabled_log { category = "ContainerRegistryLoginEvents" }
}
