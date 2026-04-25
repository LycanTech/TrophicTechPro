# ─── Networking Module ──────────────────────────────────────────────────────────
#
# Provisions:
#   - Virtual Network with four purpose-segregated subnets
#   - AKS system subnet   (10.x.0.0/22  — 1 022 IPs, control-plane nodes)
#   - AKS app subnet      (10.x.4.0/22  — 1 022 IPs, autoscaled app nodes)
#   - Database subnet     (10.x.8.0/24  — delegated to PostgreSQL Flexible Server)
#   - Private-endpoint subnet (10.x.9.0/24 — ACR, Key Vault private links)
#   - NSGs on every subnet (least-privilege; AKS NSGs managed by AKS itself)

resource "azurerm_virtual_network" "main" {
  name                = "${var.name_prefix}-vnet"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = var.vnet_address_space

  tags = var.tags
}

# ─── AKS system node pool subnet ───────────────────────────────────────────────
resource "azurerm_subnet" "aks_system" {
  name                 = "${var.name_prefix}-snet-aks-system"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.aks_system_subnet_cidr]
}

# ─── AKS app (user) node pool subnet ───────────────────────────────────────────
resource "azurerm_subnet" "aks_app" {
  name                 = "${var.name_prefix}-snet-aks-app"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.aks_app_subnet_cidr]
}

# ─── Database subnet — delegated to PostgreSQL Flexible Server ─────────────────
# Delegation allows the PG server to inject a NIC into this subnet
# (private access mode — no public endpoint exposed).
resource "azurerm_subnet" "database" {
  name                 = "${var.name_prefix}-snet-database"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.database_subnet_cidr]

  delegation {
    name = "pg-flexible-delegation"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# ─── Private endpoint subnet (ACR, Key Vault, etc.) ───────────────────────────
# private_endpoint_network_policies = "Disabled" is required for private endpoints
# to resolve correctly inside the VNet.
resource "azurerm_subnet" "private_endpoints" {
  name                              = "${var.name_prefix}-snet-pe"
  resource_group_name               = var.resource_group_name
  virtual_network_name              = azurerm_virtual_network.main.name
  address_prefixes                  = [var.private_endpoint_subnet_cidr]
  private_endpoint_network_policies = "Disabled"
}

# ─── NSG — AKS system subnet ───────────────────────────────────────────────────
# AKS manages its own required rules; we add an explicit deny-all inbound
# from the internet. The AKS control plane uses service tags internally.
resource "azurerm_network_security_group" "aks_system" {
  name                = "${var.name_prefix}-nsg-aks-system"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "DenyInternetInbound"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  tags = var.tags
}

resource "azurerm_subnet_network_security_group_association" "aks_system" {
  subnet_id                 = azurerm_subnet.aks_system.id
  network_security_group_id = azurerm_network_security_group.aks_system.id
}

# ─── NSG — AKS app subnet ──────────────────────────────────────────────────────
resource "azurerm_network_security_group" "aks_app" {
  name                = "${var.name_prefix}-nsg-aks-app"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowLoadBalancerInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyInternetInbound"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  tags = var.tags
}

resource "azurerm_subnet_network_security_group_association" "aks_app" {
  subnet_id                 = azurerm_subnet.aks_app.id
  network_security_group_id = azurerm_network_security_group.aks_app.id
}

# ─── NSG — Database subnet ─────────────────────────────────────────────────────
# Allow PostgreSQL JDBC (5432) from AKS subnets only — no internet access.
resource "azurerm_network_security_group" "database" {
  name                = "${var.name_prefix}-nsg-database"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowPostgresFromAKS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefixes    = [var.aks_system_subnet_cidr, var.aks_app_subnet_cidr]
    destination_address_prefix = "*"
  }

  # PostgreSQL Flexible Server HA: standby replica contacts primary within the same
  # subnet — must be explicitly allowed because DenyAllOtherInbound blocks it otherwise.
  security_rule {
    name                       = "AllowPostgresHAIntraSubnet"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = var.database_subnet_cidr
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllOtherInbound"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = var.tags
}

resource "azurerm_subnet_network_security_group_association" "database" {
  subnet_id                 = azurerm_subnet.database.id
  network_security_group_id = azurerm_network_security_group.database.id
}
