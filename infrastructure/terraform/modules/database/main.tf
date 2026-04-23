# ─── Database Module ────────────────────────────────────────────────────────────
#
# Provisions:
#   - Azure Database for PostgreSQL Flexible Server v16
#   - Zone-redundant HA (standby replica in a different AZ — auto-failover < 60s)
#   - VNet-injected private access (no public endpoint)
#   - Private DNS zone  (*.postgres.database.azure.com) linked to the VNet
#   - Hardened parameter configuration (SSL enforced, TLS 1.2+, connection throttle)
#   - The application database (zingy_mc by default)
#
# The Prisma connection string is exposed as a sensitive output for Key Vault ingestion.

locals {
  fqdn_suffix = "${var.name_prefix}.postgres.database.azure.com"
}

# ─── Private DNS zone for PostgreSQL Flexible Server ──────────────────────────
# PG Flexible Server with private access requires a delegated subnet AND a DNS zone.
# The FQDN resolves to the private NIC — no traffic ever leaves the VNet.
resource "azurerm_private_dns_zone" "postgres" {
  name                = "${var.name_prefix}.private.postgres.database.azure.com"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "${var.name_prefix}-pg-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.tags
}

# ─── PostgreSQL Flexible Server ────────────────────────────────────────────────
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.name_prefix}-pg"
  location               = var.location
  resource_group_name    = var.resource_group_name
  version                = var.pg_version
  delegated_subnet_id    = var.database_subnet_id
  private_dns_zone_id    = azurerm_private_dns_zone.postgres.id
  administrator_login    = var.admin_username
  administrator_password = var.admin_password
  sku_name               = var.sku_name
  storage_mb             = var.storage_mb
  storage_tier           = var.storage_tier

  # ── Zone-redundant high-availability ────────────────────────────────────────
  # Standby replica in a separate AZ; failover is transparent to the application.
  # Set mode = "Disabled" for staging to cut cost by ~50%.
  dynamic "high_availability" {
    for_each = var.ha_enabled ? [1] : []
    content {
      mode = "ZoneRedundant"
    }
  }

  # ── Maintenance window — apply patches Sunday at 03:00 UTC ──────────────────
  maintenance_window {
    day_of_week  = 0   # Sunday
    start_hour   = 3
    start_minute = 0
  }

  # ── Backup ──────────────────────────────────────────────────────────────────
  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup

  tags = var.tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]

  lifecycle {
    ignore_changes = [
      zone,                    # Azure may change AZ during maintenance
      high_availability[0].standby_availability_zone,
    ]
  }
}

# ─── Server parameter hardening ────────────────────────────────────────────────
# ssl_min_protocol_version — reject connections below TLS 1.2
resource "azurerm_postgresql_flexible_server_configuration" "ssl_min_protocol" {
  name      = "ssl_min_protocol_version"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "TLSv1.2"
}

# connection_throttle — slow brute-force by throttling failed auth
resource "azurerm_postgresql_flexible_server_configuration" "connection_throttle" {
  name      = "connection_throttle.enable"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# log_checkpoints — essential for diagnosing I/O performance issues
resource "azurerm_postgresql_flexible_server_configuration" "log_checkpoints" {
  name      = "log_checkpoints"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# log_connections — audit every new connection (required for SOC 2 / ISO 27001)
resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# ─── Application database ─────────────────────────────────────────────────────
resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"

  lifecycle {
    prevent_destroy = true   # accidental terraform destroy would drop all data
  }
}

# ─── Diagnostic settings ──────────────────────────────────────────────────────
resource "azurerm_monitor_diagnostic_setting" "postgres" {
  count = var.log_analytics_workspace_id != "" ? 1 : 0

  name                       = "${var.name_prefix}-pg-diag"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log { category = "PostgreSQLLogs" }
}
