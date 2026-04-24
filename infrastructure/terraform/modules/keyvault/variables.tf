variable "name_prefix"               { type = string }
variable "location"                  { type = string }
variable "resource_group_name"       { type = string }
variable "vnet_id"                   { type = string }
variable "private_endpoint_subnet_id" { type = string }

variable "database_connection_string" {
  type      = string
  sensitive = true
}

variable "auth_secret" {
  type      = string
  sensitive = true
}

variable "nextauth_url" { type = string }

variable "aks_workload_identity_object_id" {
  type    = string
  default = ""
  description = "Object ID of the AKS workload identity that reads secrets via CSI driver"
}

variable "soft_delete_retention_days" {
  type    = number
  default = 90
}

variable "purge_protection_enabled" {
  type    = bool
  default = true
  description = "Prevents hard-deletion of the vault. Set false only in dev."
}

variable "public_network_access_enabled" {
  type    = bool
  default = false
  description = "Allow public HTTPS access to the vault. Set true in staging so CI runners can write secrets."
}

variable "tags" {
  type    = map(string)
  default = {}
}
