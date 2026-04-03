terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.100.0, < 4.0.0"
    }
    azapi = {
      source  = "azure/azapi"
      version = ">= 1.13.0"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "azapi" {}
