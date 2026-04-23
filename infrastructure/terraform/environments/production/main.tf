# ─── Production Environment ─────────────────────────────────────────────────────
#
# Root module that composes all Trophic Tech modules into a production-grade stack.
# Apply order (Terraform resolves automatically via output references):
#   1. monitoring   — Log Analytics workspace (needed by all others for diag settings)
#   2. networking   — VNet + subnets (needed by AKS, ACR, database, keyvault)
#   3. acr          — Container registry (needs networking)
#   4. database     — PostgreSQL (needs networking)
#   5. aks          — Kubernetes cluster (needs networking + monitoring + ACR ID)
#   6. keyvault     — Secrets store (needs networking + database conn string)
#   Cross-cutting: AcrPull role assignment (AKS kubelet → ACR)

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

  # Remote state — Azure Blob Storage.
  # Uncomment and populate after running:
  #   az group create -n trophic-tfstate-rg -l eastus2
  #   az storage account create -n trophictfstate -g trophic-tfstate-rg --sku Standard_LRS
  #   az storage container create -n tfstate --account-name trophictfstate
  #
  # backend "azurerm" {
  #   resource_group_name  = "trophic-tfstate-rg"
  #   storage_account_name = "trophictfstate"
  #   container_name       = "tfstate"
  #   key                  = "production/terraform.tfstate"
  # }
}

provider "azurerm" {
  subscription_id = var.subscription_id

  features {
    key_vault {
      purge_soft_delete_on_destroy    = false   # never hard-delete secrets accidentally
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

# ─── Shared locals ────────────────────────────────────────────────────────────
locals {
  name_prefix = "${var.project}-${var.environment}"

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = "platform@trophictech.io"
  }
}

# ─── Resource group ───────────────────────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

# ─── 1. Monitoring (first — all other modules send logs here) ─────────────────
module "monitoring" {
  source = "../../modules/monitoring"

  name_prefix          = local.name_prefix
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  log_retention_in_days = 90
  alert_email          = var.alert_email
  alert_webhook_url    = var.slack_webhook_url

  # AKS and PostgreSQL IDs wired in after those resources are created
  aks_cluster_id       = module.aks.cluster_id
  postgresql_server_id = module.database.postgresql_id

  tags = local.tags
}

# ─── 2. Networking ────────────────────────────────────────────────────────────
module "networking" {
  source = "../../modules/networking"

  name_prefix          = local.name_prefix
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  vnet_address_space   = ["10.0.0.0/16"]
  tags                 = local.tags
}

# ─── 3. Container Registry ────────────────────────────────────────────────────
module "acr" {
  source = "../../modules/acr"

  name_prefix                = local.name_prefix
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  vnet_id                    = module.networking.vnet_id
  private_endpoint_subnet_id = module.networking.private_endpoint_subnet_id
  sku                        = "Premium"
  georeplication_locations   = var.acr_georeplication_locations
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  tags                       = local.tags
}

# ─── 4. Database ──────────────────────────────────────────────────────────────
module "database" {
  source = "../../modules/database"

  name_prefix                = local.name_prefix
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  vnet_id                    = module.networking.vnet_id
  database_subnet_id         = module.networking.database_subnet_id
  admin_username             = var.db_admin_username
  admin_password             = var.db_admin_password
  pg_version                 = "16"
  sku_name                   = "GP_Standard_D2s_v3"
  storage_mb                 = 65536   # 64 GB
  ha_enabled                 = true
  geo_redundant_backup        = true
  backup_retention_days      = 35
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  tags                       = local.tags
}

# ─── 5. AKS ──────────────────────────────────────────────────────────────────
module "aks" {
  source = "../../modules/aks"

  name_prefix                = local.name_prefix
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  aks_system_subnet_id       = module.networking.aks_system_subnet_id
  aks_app_subnet_id          = module.networking.aks_app_subnet_id
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  kubernetes_version         = var.kubernetes_version
  system_node_count          = 2
  system_node_vm_size        = "Standard_D2s_v3"
  app_node_vm_size           = "Standard_D4s_v3"
  app_node_min_count         = 2
  app_node_max_count         = 10
  private_cluster_enabled    = true
  tags                       = local.tags
}

# ─── 6. Key Vault (requires DB connection string — runs after database) ────────
module "keyvault" {
  source = "../../modules/keyvault"

  name_prefix                     = local.name_prefix
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  vnet_id                         = module.networking.vnet_id
  private_endpoint_subnet_id      = module.networking.private_endpoint_subnet_id
  database_connection_string      = module.database.connection_string
  auth_secret                     = var.auth_secret
  nextauth_url                    = "https://${var.app_hostname}"
  aks_workload_identity_object_id = module.aks.kubelet_identity_object_id
  purge_protection_enabled        = true
  tags                            = local.tags
}

# ─── Cross-cutting: AcrPull — AKS kubelet identity → ACR ─────────────────────
# Allows the cluster to pull images without imagePullSecrets in every pod spec.
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id         = module.aks.kubelet_identity_object_id
  role_definition_name = "AcrPull"
  scope                = module.acr.acr_id

  skip_service_principal_aad_check = true   # managed identity — skip AAD propagation wait
}
