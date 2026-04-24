# ─── Key Vault Module ────────────────────────────────────────────────────────────
#
# Provisions:
#   - Azure Key Vault with RBAC authorisation (preferred over access policies)
#   - Soft-delete (90 days) + purge protection — prevents accidental secret loss
#   - Private endpoint in the private-endpoints subnet (no public KV access)
#   - Private DNS zone  (privatelink.vaultcore.azure.net)
#   - Three application secrets: DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL
#   - Role assignment: Key Vault Secrets User for the AKS workload identity
#     (pods use CSI driver to mount secrets — no env-var credential injection)

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = "${var.name_prefix}-kv"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  rbac_authorization_enabled = true   # RBAC model — no legacy access policies
  soft_delete_retention_days = var.soft_delete_retention_days
  purge_protection_enabled   = var.purge_protection_enabled

  # Disallow all public traffic — secrets only reachable through private endpoint
  public_network_access_enabled = false

  network_acls {
    bypass         = "AzureServices"
    default_action = "Deny"
    ip_rules       = []
  }

  tags = var.tags
}

# ─── Private DNS zone ──────────────────────────────────────────────────────────
resource "azurerm_private_dns_zone" "kv" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "kv" {
  name                  = "${var.name_prefix}-kv-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.kv.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.tags
}

# ─── Private endpoint ──────────────────────────────────────────────────────────
resource "azurerm_private_endpoint" "kv" {
  name                = "${var.name_prefix}-pe-kv"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.name_prefix}-psc-kv"
    private_connection_resource_id = azurerm_key_vault.main.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "kv-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.kv.id]
  }

  tags = var.tags
}

# ─── Role assignment — terraform runner needs Secrets Officer to write secrets ──
resource "azurerm_role_assignment" "kv_secrets_officer_deployer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ─── Application secrets ───────────────────────────────────────────────────────
# Stored in Key Vault; the AKS CSI driver mounts them as files or env vars.
resource "azurerm_key_vault_secret" "database_url" {
  name         = "DATABASE-URL"
  value        = var.database_connection_string
  key_vault_id = azurerm_key_vault.main.id
  tags         = { ManagedBy = "terraform" }

  depends_on = [azurerm_role_assignment.kv_secrets_officer_deployer]
}

resource "azurerm_key_vault_secret" "auth_secret" {
  name         = "AUTH-SECRET"
  value        = var.auth_secret
  key_vault_id = azurerm_key_vault.main.id
  tags         = { ManagedBy = "terraform" }

  depends_on = [azurerm_role_assignment.kv_secrets_officer_deployer]
}

resource "azurerm_key_vault_secret" "nextauth_url" {
  name         = "NEXTAUTH-URL"
  value        = var.nextauth_url
  key_vault_id = azurerm_key_vault.main.id
  tags         = { ManagedBy = "terraform" }

  depends_on = [azurerm_role_assignment.kv_secrets_officer_deployer]
}

# ─── Role assignment — AKS workload identity reads secrets via CSI driver ──────
# This is the identity the Helm chart's SecretProviderClass references.
resource "azurerm_role_assignment" "kv_secrets_user_aks" {
  for_each = toset(
    var.aks_workload_identity_object_id != "" ? [var.aks_workload_identity_object_id] : []
  )

  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = each.value
}
