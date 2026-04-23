variable "name_prefix"          { type = string }
variable "location"             { type = string }
variable "resource_group_name"  { type = string }

variable "log_retention_in_days" {
  type    = number
  default = 30
  description = "30 days (Basic tier) or 90+ (Analytics tier) — increase for compliance"
}

variable "alert_email" {
  type    = string
  default = ""
  description = "Ops email for alert notifications"
}

variable "alert_webhook_url" {
  type    = string
  default = ""
  description = "Slack incoming webhook URL or generic webhook for alert routing"
}

variable "aks_cluster_id" {
  type    = string
  default = ""
  description = "AKS cluster resource ID — if set, AKS metric alerts are created"
}

variable "postgresql_server_id" {
  type    = string
  default = ""
  description = "PostgreSQL Flexible Server resource ID — if set, DB alerts are created"
}

variable "tags" {
  type    = map(string)
  default = {}
}
