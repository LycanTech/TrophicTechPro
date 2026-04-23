variable "name_prefix"                { type = string }
variable "location"                   { type = string }
variable "resource_group_name"        { type = string }

variable "vnet_address_space" {
  type    = list(string)
  default = ["10.0.0.0/16"]
}

variable "aks_system_subnet_cidr" {
  type    = string
  default = "10.0.0.0/22"
}

variable "aks_app_subnet_cidr" {
  type    = string
  default = "10.0.4.0/22"
}

variable "database_subnet_cidr" {
  type    = string
  default = "10.0.8.0/24"
}

variable "private_endpoint_subnet_cidr" {
  type    = string
  default = "10.0.9.0/24"
}

variable "tags" {
  type    = map(string)
  default = {}
}
