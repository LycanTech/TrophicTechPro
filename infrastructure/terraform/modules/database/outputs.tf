output "server_name"    { value = azurerm_postgresql_flexible_server.main.name }
output "server_fqdn"    { value = azurerm_postgresql_flexible_server.main.fqdn }
output "database_name"  { value = azurerm_postgresql_flexible_server_database.app.name }
output "postgresql_id"  { value = azurerm_postgresql_flexible_server.main.id }

# Private-access Flexible Servers are VNet-injected — public_network_access_enabled = false.
# The public FQDN (*.postgres.database.azure.com) is unreachable from inside the VNet.
# Use the private DNS zone FQDN so AKS pods resolve to the server's private NIC IP.
output "connection_string" {
  value = "postgresql://${var.admin_username}:${var.admin_password}@${azurerm_postgresql_flexible_server.main.name}.${azurerm_private_dns_zone.postgres.name}:5432/${var.database_name}?sslmode=require"
  sensitive = true
}
