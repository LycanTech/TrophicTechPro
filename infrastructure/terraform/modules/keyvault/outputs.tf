output "key_vault_id"   { value = azurerm_key_vault.main.id }
output "key_vault_name" { value = azurerm_key_vault.main.name }
output "key_vault_uri"  { value = azurerm_key_vault.main.vault_uri }

output "database_url_secret_name"  { value = azurerm_key_vault_secret.database_url.name }
output "auth_secret_secret_name"   { value = azurerm_key_vault_secret.auth_secret.name }
output "nextauth_url_secret_name"  { value = azurerm_key_vault_secret.nextauth_url.name }
