variable "name_prefix"          { type = string }
variable "location"             { type = string }
variable "resource_group_name"  { type = string }
variable "aks_system_subnet_id" { type = string }
variable "aks_app_subnet_id"    { type = string }
variable "log_analytics_workspace_id" { type = string }

variable "kubernetes_version" {
  type    = string
  default = null   # null → Azure picks the current stable default
}

variable "system_node_count" {
  type    = number
  default = 2
}

variable "system_node_vm_size" {
  type    = string
  default = "Standard_D2s_v3"
}

variable "app_node_vm_size" {
  type    = string
  default = "Standard_D4s_v3"
}

variable "app_node_min_count" {
  type    = number
  default = 2
}

variable "app_node_max_count" {
  type    = number
  default = 5
}

variable "service_cidr" {
  type    = string
  default = "172.16.0.0/16"
  description = "CIDR for Kubernetes service IPs — must not overlap with VNet or pod subnets"
}

variable "dns_service_ip" {
  type    = string
  default = "172.16.0.10"
  description = "Must be within service_cidr"
}

variable "private_cluster_enabled" {
  type    = bool
  default = false
  description = "Set true in production to hide the API server behind a private endpoint"
}

variable "tags" {
  type    = map(string)
  default = {}
}
