variable "subscription_id" {
  type        = string
  description = "Azure subscription ID"
}

variable "project" {
  type        = string
  default     = "zingy"
  description = "Project name — used in resource naming and tags"
}

variable "environment" {
  type        = string
  default     = "staging"
  description = "Environment name — used in resource naming and tags"
}

variable "location" {
  type        = string
  default     = "eastus2"
  description = "Primary Azure region for all resources"
}

variable "db_admin_username" {
  type        = string
  default     = "zingyadmin"
  description = "PostgreSQL administrator username"
}

variable "db_admin_password" {
  type        = string
  sensitive   = true
  description = "PostgreSQL administrator password (min 8 chars, must contain uppercase, lowercase, digit)"
}

variable "auth_secret" {
  type        = string
  sensitive   = true
  description = "Auth.js AUTH_SECRET — generate with: openssl rand -base64 32"
}

variable "alert_email" {
  type        = string
  default     = ""
  description = "Email address for monitoring alerts (leave empty to disable)"
}
