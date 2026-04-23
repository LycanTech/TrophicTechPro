variable "name_prefix"               { type = string }
variable "location"                  { type = string }
variable "resource_group_name"       { type = string }
variable "vnet_id"                   { type = string }
variable "private_endpoint_subnet_id" { type = string }

variable "sku" {
  type        = string
  default     = "Premium"
  description = "Registry SKU. Premium required for private endpoints and geo-replication. Standard minimum for private endpoints. Basic = public only."
}

variable "enable_private_endpoint" {
  type        = bool
  default     = true
  description = "Create a private endpoint for the registry. Requires Standard or Premium SKU. Set false for staging/Basic."
}

variable "public_network_access_enabled" {
  type        = bool
  default     = false
  description = "Allow public network access. Must be true when enable_private_endpoint = false."
}

variable "georeplication_locations" {
  type        = list(string)
  default     = []
  description = "Additional Azure regions for geo-replication (Premium SKU only)."
}

variable "log_analytics_workspace_id" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
