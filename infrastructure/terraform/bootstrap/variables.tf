variable "subscription_id" {
  type        = string
  description = "Azure subscription ID"
}

variable "location" {
  type        = string
  default     = "eastus2"
  description = "Azure region for the Terraform state storage account"
}

variable "resource_group_name" {
  type        = string
  default     = "trophic-tfstate-rg"
  description = "Name of the resource group that holds Terraform remote state"
}
