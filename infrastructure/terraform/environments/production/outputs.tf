output "resource_group_name" { value = azurerm_resource_group.main.name }

output "aks_cluster_name" { value = module.aks.cluster_name }
output "aks_oidc_issuer_url" { value = module.aks.oidc_issuer_url }

output "acr_login_server" { value = module.acr.login_server }
output "acr_name"         { value = module.acr.acr_name }

output "db_server_fqdn"   { value = module.database.server_fqdn }
output "db_name"          { value = module.database.database_name }

output "key_vault_name"   { value = module.keyvault.key_vault_name }
output "key_vault_uri"    { value = module.keyvault.key_vault_uri }

output "log_analytics_workspace_id" { value = module.monitoring.log_analytics_workspace_id }

# Emit Helm values for the CI/CD pipeline — used in main.yml deploy step
output "helm_values_snippet" {
  value = <<-EOT
    image.repository: ${module.acr.login_server}/${var.project}-mission-control
    ingress.host: ${var.app_hostname}
    existingSecret: ${local.name_prefix}-mc-secrets
  EOT
}
