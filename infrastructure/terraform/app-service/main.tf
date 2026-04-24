# ─── Trophic Tech — App Service Infrastructure ────────────────────────────────
#
# Provisions:
#   - Resource Group
#   - App Service Plan (Linux, Node 20)
#   - Web App: staging
#   - Web App: production
#   - PostgreSQL Flexible Server (single instance, public access with IP firewall)
#
# Run once to provision, then use the CI/CD pipeline for all deployments.
# Apply: terraform init && terraform apply

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
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
    container_name       = "tfstate-appservice"
    key                  = "appservice/terraform.tfstate"
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}

# ─── Variables ────────────────────────────────────────────────────────────────
variable "subscription_id"   { type = string }
variable "location"          { type = string; default = "eastus2" }
variable "project"           { type = string; default = "trophic" }
variable "db_admin_username" { type = string; default = "trophicadmin" }
variable "db_admin_password" {
  type      = string
  sensitive = true
}

locals {
  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# ─── Resource Group ───────────────────────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = "${var.project}-rg"
  location = var.location
  tags     = local.tags
}

# ─── App Service Plan ─────────────────────────────────────────────────────────
resource "azurerm_service_plan" "main" {
  name                = "${var.project}-asp"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B2"   # 2 cores / 3.5 GB — handles both staging and prod slots

  tags = local.tags
}

# ─── Staging Web App ─────────────────────────────────────────────────────────
resource "azurerm_linux_web_app" "staging" {
  name                = "${var.project}-staging"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  site_config {
    application_stack {
      node_version = "20-lts"
    }
    always_on = false   # B-series supports always-on; set false to save cost on staging
  }

  app_settings = {
    NODE_ENV              = "production"
    NEXT_TELEMETRY_DISABLED = "1"
    SCM_DO_BUILD_DURING_DEPLOYMENT = "true"
    WEBSITE_RUN_FROM_PACKAGE       = "1"
  }

  tags = local.tags
}

# ─── Production Web App ───────────────────────────────────────────────────────
resource "azurerm_linux_web_app" "production" {
  name                = "${var.project}-production"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  site_config {
    application_stack {
      node_version = "20-lts"
    }
    always_on = true
  }

  app_settings = {
    NODE_ENV                       = "production"
    NEXT_TELEMETRY_DISABLED        = "1"
    SCM_DO_BUILD_DURING_DEPLOYMENT = "true"
    WEBSITE_RUN_FROM_PACKAGE       = "1"
  }

  tags = local.tags
}

# ─── PostgreSQL Flexible Server ───────────────────────────────────────────────
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "${var.project}-pg"
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  version                       = "16"
  administrator_login           = var.db_admin_username
  administrator_password        = var.db_admin_password
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  backup_retention_days         = 7
  geo_redundant_backup_enabled  = false
  public_network_access_enabled = true

  tags = local.tags
}

# Allow Azure services (App Service) to reach the database
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# ─── Outputs ─────────────────────────────────────────────────────────────────
output "staging_url" {
  value = "https://${azurerm_linux_web_app.staging.default_hostname}"
}

output "production_url" {
  value = "https://${azurerm_linux_web_app.production.default_hostname}"
}

output "staging_app_name" {
  value = azurerm_linux_web_app.staging.name
}

output "production_app_name" {
  value = azurerm_linux_web_app.production.name
}

output "db_host" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "db_connection_string_template" {
  value     = "postgresql://${var.db_admin_username}:PASSWORD@${azurerm_postgresql_flexible_server.main.fqdn}:5432/trophic_mc?sslmode=require"
  sensitive = true
}
