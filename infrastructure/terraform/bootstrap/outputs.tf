output "storage_account_name" {
  description = "Storage account name — paste into the backend blocks of each environment"
  value       = azurerm_storage_account.tfstate.name
}

output "resource_group_name" {
  description = "Resource group that owns the state storage account"
  value       = azurerm_resource_group.tfstate.name
}

output "staging_container_name" {
  description = "Blob container for staging state"
  value       = azurerm_storage_container.staging.name
}

output "production_container_name" {
  description = "Blob container for production state"
  value       = azurerm_storage_container.production.name
}
