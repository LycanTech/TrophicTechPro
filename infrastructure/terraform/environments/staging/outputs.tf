output "resource_group_name" {
  description = "Name of the staging resource group"
  value       = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = module.aks.cluster_name
}

output "aks_oidc_issuer_url" {
  description = "AKS OIDC issuer URL (for Workload Identity federation)"
  value       = module.aks.oidc_issuer_url
}

output "acr_login_server" {
  description = "ACR login server URL — set as ACR_REGISTRY in CI/CD"
  value       = module.acr.login_server
}

output "acr_name" {
  description = "ACR resource name"
  value       = module.acr.acr_name
}

output "db_server_fqdn" {
  description = "PostgreSQL Flexible Server FQDN"
  value       = module.database.server_fqdn
}

output "db_name" {
  description = "Application database name"
  value       = module.database.database_name
}

output "key_vault_name" {
  description = "Key Vault resource name"
  value       = module.keyvault.key_vault_name
}

output "key_vault_uri" {
  description = "Key Vault URI for CSI driver configuration"
  value       = module.keyvault.key_vault_uri
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace resource ID"
  value       = module.monitoring.log_analytics_workspace_id
}

output "helm_values_snippet" {
  description = "Helm --set flags for staging CI/CD deploy step"
  value = <<-EOT
    image.repository=${module.acr.login_server}/mission-control
    ingress.host=staging.zingy.io
    existingSecret=zingy-mc-secrets
  EOT
}
