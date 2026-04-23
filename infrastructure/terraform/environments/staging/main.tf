# ─── Staging Environment ─────────────────────────────────────────────────────────
#
# Mirrors production but with cost-optimised settings:
#   - Smaller VM sizes (B-series / D2)
#   - No HA on PostgreSQL (saves ~50% of DB cost)
#   - No geo-replication on ACR
#   - Private cluster disabled (simpler access for the dev team)
#   - Shorter log retention (30 days)
#   - Single AKS app node minimum

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  required_version = ">= 1.9.0"

  backend "azurerm" {
    resource_group_name  = "TrophicTechPro"
    storage_account_name = "trophictechstorage"
    container_name       = "tfstate-staging"
    key                  = "staging/terraform.tfstate"
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true    # allow cleanup in staging
      recover_soft_deleted_key_vaults = true
    }
  }
}

locals {
  name_prefix = "${var.project}-${var.environment}"
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = "platform@zingy.io"
  }
}

resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

module "monitoring" {
  source = "../../modules/monitoring"

  name_prefix           = local.name_prefix
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  log_retention_in_days = 30
  alert_email           = var.alert_email
  aks_cluster_id        = module.aks.cluster_id
  postgresql_server_id  = module.database.postgresql_id
  tags                  = local.tags
}

module "networking" {
  source = "../../modules/networking"

  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

module "acr" {
  source = "../../modules/acr"

  name_prefix                   = local.name_prefix
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  vnet_id                       = module.networking.vnet_id
  private_endpoint_subnet_id    = module.networking.private_endpoint_subnet_id
  sku                           = "Standard"              # Basic does not support private endpoints
  enable_private_endpoint       = false                   # cost saving — staging uses public access
  public_network_access_enabled = true                    # required when private endpoint is disabled
  log_analytics_workspace_id    = module.monitoring.log_analytics_workspace_id
  tags                          = local.tags
}

module "database" {
  source = "../../modules/database"

  name_prefix                = local.name_prefix
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  vnet_id                    = module.networking.vnet_id
  database_subnet_id         = module.networking.database_subnet_id
  admin_username             = var.db_admin_username
  admin_password             = var.db_admin_password
  sku_name                   = "B_Standard_B1ms"   # burstable — lowest cost
  storage_mb                 = 32768
  ha_enabled                 = false    # no standby replica in staging
  geo_redundant_backup        = false
  backup_retention_days      = 7
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  tags                       = local.tags
}

module "aks" {
  source = "../../modules/aks"

  name_prefix                = local.name_prefix
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  aks_system_subnet_id       = module.networking.aks_system_subnet_id
  aks_app_subnet_id          = module.networking.aks_app_subnet_id
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  system_node_count          = 1    # single system node — tolerate brief upgrades
  system_node_vm_size        = "Standard_D2s_v3"
  app_node_vm_size           = "Standard_D2s_v3"
  app_node_min_count         = 1
  app_node_max_count         = 3
  private_cluster_enabled    = false  # dev team accesses API server directly
  tags                       = local.tags
}

module "keyvault" {
  source = "../../modules/keyvault"

  name_prefix                     = local.name_prefix
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  vnet_id                         = module.networking.vnet_id
  private_endpoint_subnet_id      = module.networking.private_endpoint_subnet_id
  database_connection_string      = module.database.connection_string
  auth_secret                     = var.auth_secret
  nextauth_url                    = "https://staging.zingy.io"
  aks_workload_identity_object_id = module.aks.kubelet_identity_object_id
  purge_protection_enabled        = false   # allow staging vault cleanup
  tags                            = local.tags
}

resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = module.aks.kubelet_identity_object_id
  role_definition_name             = "AcrPull"
  scope                            = module.acr.acr_id
  skip_service_principal_aad_check = true
}

