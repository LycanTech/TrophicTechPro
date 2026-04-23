variable "name_prefix"               { type = string }
variable "location"                  { type = string }
variable "resource_group_name"       { type = string }
variable "vnet_id"                   { type = string }
variable "private_endpoint_subnet_id" { type = string }

variable "sku" {
  type    = string
  default = "Premium"
  description = "Premium required for private endpoints and geo-replication"
}

variable "georeplication_locations" {
  type    = list(string)
  default = []
  description = "Additional Azure regions for geo-replication (Premium only)"
}

variable "log_analytics_workspace_id" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
