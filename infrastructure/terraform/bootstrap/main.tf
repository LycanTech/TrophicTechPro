# ─── Terraform State Bootstrap ───────────────────────────────────────────────
#
# Run this ONCE before applying staging or production environments.
# It creates the Azure Storage Account that holds all Terraform remote state.
#
# This module uses LOCAL state intentionally — it only manages the state bucket
# itself, so it never needs to read from that bucket to plan or apply.
#
# Usage:
#   az login
#   az account set --subscription <subscription-id>
#   cd infrastructure/terraform/bootstrap
#   terraform init
#   terraform apply -var="subscription_id=<sub-id>"
#
# After apply, copy the storage_account_name output into the backend blocks
# of environments/staging/main.tf and environments/production/main.tf,
# then run `terraform init -migrate-state` in each environment.
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.9.0"
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
  # No backend block — intentionally local state for the bootstrap itself
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}

# Storage account names must be globally unique, 3-24 chars, lowercase alphanumeric
resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

locals {
  storage_account_name = "trophictfstate${random_string.suffix.result}"
}

# ─── Resource group for all Terraform state ──────────────────────────────────
resource "azurerm_resource_group" "tfstate" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Project   = "trophic"
    ManagedBy = "terraform-bootstrap"
    Purpose   = "terraform-state"
  }
}

# ─── Storage account ─────────────────────────────────────────────────────────
resource "azurerm_storage_account" "tfstate" {
  name                     = local.storage_account_name
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = azurerm_resource_group.tfstate.location
  account_tier             = "Standard"
  account_replication_type = "GRS"          # geo-redundant — state loss is catastrophic

  blob_properties {
    versioning_enabled = true               # keeps history of every state file write
    delete_retention_policy {
      days = 90                             # 90-day soft-delete on blobs
    }
    container_delete_retention_policy {
      days = 30
    }
  }

  # Prevent accidental deletion of the storage account
  lifecycle {
    prevent_destroy = true
  }

  tags = azurerm_resource_group.tfstate.tags
}

# ─── Blob containers (one per environment) ───────────────────────────────────
resource "azurerm_storage_container" "staging" {
  name                  = "tfstate-staging"
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "production" {
  name                  = "tfstate-production"
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}

# ─── Lock the storage account against deletion ───────────────────────────────
resource "azurerm_management_lock" "tfstate" {
  name       = "trophic-tfstate-lock"
  scope      = azurerm_storage_account.tfstate.id
  lock_level = "CanNotDelete"
  notes      = "Terraform remote state — do not delete"
}
