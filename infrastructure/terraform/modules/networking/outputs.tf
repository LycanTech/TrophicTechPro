output "vnet_id"                    { value = azurerm_virtual_network.main.id }
output "vnet_name"                  { value = azurerm_virtual_network.main.name }
output "aks_system_subnet_id"       { value = azurerm_subnet.aks_system.id }
output "aks_app_subnet_id"          { value = azurerm_subnet.aks_app.id }
output "database_subnet_id"         { value = azurerm_subnet.database.id }
output "private_endpoint_subnet_id" { value = azurerm_subnet.private_endpoints.id }
