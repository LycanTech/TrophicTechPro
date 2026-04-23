variable "name_prefix"          { type = string }
variable "location"             { type = string }
variable "resource_group_name"  { type = string }
variable "vnet_id"              { type = string }
variable "database_subnet_id"   { type = string }
variable "admin_username"       { type = string }
variable "admin_password"       { type = string; sensitive = true }

variable "pg_version" {
  type    = string
  default = "16"
}

variable "sku_name" {
  type    = string
  default = "GP_Standard_D2s_v3"
  description = "Flexible Server SKU: B_Standard_B1ms (dev) | GP_Standard_D2s_v3 (prod)"
}

variable "storage_mb" {
  type    = number
  default = 32768   # 32 GB — auto-grows if azure_storage_autogrow is enabled
}

variable "storage_tier" {
  type    = string
  default = "P10"
  description = "Azure managed disk tier for IOPS. P10=500 IOPS, P20=2300, P30=5000"
}

variable "database_name" {
  type    = string
  default = "zingy_mc"
}

variable "ha_enabled" {
  type    = bool
  default = true
  description = "Zone-redundant HA. Set false for staging to halve cost."
}

variable "backup_retention_days" {
  type    = number
  default = 35
}

variable "geo_redundant_backup" {
  type    = bool
  default = false
  description = "Cross-region backup — enable for DR requirements"
}

variable "log_analytics_workspace_id" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
