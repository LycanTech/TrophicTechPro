variable "subscription_id" {
  type        = string
  description = "Azure subscription ID"
}

variable "location" {
  type        = string
  default     = "eastus"
  description = "Azure region for the Terraform state storage account"
}

variable "resource_group_name" {
  type        = string
  default     = "TrophicTechPro"
  description = "Name of the resource group that holds Terraform remote state"
}

variable "storage_account_name" {
  type        = string
  description = "Globally unique storage account name for Terraform state (3-24 chars, lowercase alphanumeric)"
}
