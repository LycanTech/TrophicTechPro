variable "subscription_id" {
  type        = string
  description = "Azure subscription ID"
}

variable "project" {
  type    = string
  default = "zingy"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "location" {
  type    = string
  default = "eastus2"
  description = "Primary Azure region. Use paired region for DR."
}

variable "kubernetes_version" {
  type    = string
  default = "1.31"
}

variable "db_admin_username" {
  type    = string
  default = "zingyadmin"
}

variable "db_admin_password" {
  type      = string
  sensitive = true
}

variable "auth_secret" {
  type      = string
  sensitive = true
  description = "next-auth AUTH_SECRET — generate with: openssl rand -base64 32"
}

variable "app_hostname" {
  type    = string
  default = "app.zingy.io"
}

variable "alert_email" {
  type    = string
  default = ""
}

variable "slack_webhook_url" {
  type      = string
  default   = ""
  sensitive = true
}

variable "acr_georeplication_locations" {
  type    = list(string)
  default = []
  description = "Secondary regions for ACR geo-replication (empty in staging)"
}
