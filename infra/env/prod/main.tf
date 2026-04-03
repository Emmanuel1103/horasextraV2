data "azurerm_resource_group" "shared" {
  name = var.shared_rg_name
}

data "azurerm_container_app_environment" "shared" {
  name                = var.shared_cae_name
  resource_group_name = data.azurerm_resource_group.shared.name
}

data "azurerm_container_registry" "shared" {
  name                = var.shared_acr_name
  resource_group_name = data.azurerm_resource_group.shared.name
}

data "azurerm_user_assigned_identity" "shared" {
  name                = var.shared_umi_name
  resource_group_name = data.azurerm_resource_group.shared.name
}

data "azurerm_key_vault" "shared" {
  name                = var.shared_kv_name
  resource_group_name = data.azurerm_resource_group.shared.name
}

locals {
  app_slug = "gestion-horas-extra"
  app_short  = "ghe"
  aca_prefix = "fsd-proc"

  rg_name  = "${var.prefix}-${local.app_slug}-rg-${var.location_short}-${var.env}-${var.seq}"
  # Container App names are limited to 32 chars; use a short, stable name.
  api_name = "${local.aca_prefix}-${local.app_short}-api-${var.location_short}-${var.env}-${var.seq}"
  web_name = "${local.aca_prefix}-${local.app_short}-web-${var.location_short}-${var.env}-${var.seq}"

  image_api = "${data.azurerm_container_registry.shared.login_server}/${var.prefix}-${local.app_slug}-api:${var.api_image_tag}"
  image_web = "${data.azurerm_container_registry.shared.login_server}/${var.prefix}-${local.app_slug}-web:${var.web_image_tag}"

  uniq = substr(md5("${var.prefix}-${local.app_slug}-${var.env}"), 0, 6)

  cosmos_account_name  = "fsdpro${local.uniq}${var.env}cosmos001"
  storage_account_name = "fsdpro${local.uniq}${var.env}st001"

  jwt_issuer = "https://login.microsoftonline.com/${var.tenant_id}/v2.0"
  jwks_uri   = "https://login.microsoftonline.com/${var.tenant_id}/discovery/v2.0/keys"

  tags = {
    environment = var.env
    project     = "fsd-procesos"
    app         = local.app_slug
  }
}

resource "azurerm_resource_group" "app" {
  name     = local.rg_name
  location = var.location
  tags     = local.tags
}

resource "azurerm_cosmosdb_account" "cosmos" {
  name                = local.cosmos_account_name
  location            = azurerm_resource_group.app.location
  resource_group_name = azurerm_resource_group.app.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.app.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  public_network_access_enabled = true
  tags                          = local.tags
}

resource "azurerm_cosmosdb_sql_database" "db" {
  name                = "HorasExtrasDB"
  resource_group_name = azurerm_resource_group.app.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
}

resource "azurerm_cosmosdb_sql_container" "requests" {
  name                = "solicitudes_horas_extra"
  resource_group_name = azurerm_resource_group.app.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_path  = "/id"
}

resource "azurerm_storage_account" "blob" {
  name                     = local.storage_account_name
  resource_group_name      = azurerm_resource_group.app.name
  location                 = azurerm_resource_group.app.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  min_tls_version          = "TLS1_2"
  allow_nested_items_to_be_public = false
  tags                     = local.tags
}

resource "azurerm_storage_container" "blob" {
  name                  = var.blob_container_name
  storage_account_name  = azurerm_storage_account.blob.name
  container_access_type = "private"
}

resource "azurerm_key_vault_secret" "cosmos_url" {
  name         = "${var.prefix}-${local.app_slug}-${var.env}-cosmos-db-url"
  value        = azurerm_cosmosdb_account.cosmos.endpoint
  key_vault_id = data.azurerm_key_vault.shared.id
}

resource "azurerm_key_vault_secret" "cosmos_key" {
  name         = "${var.prefix}-${local.app_slug}-${var.env}-cosmos-db-key"
  value        = azurerm_cosmosdb_account.cosmos.primary_key
  key_vault_id = data.azurerm_key_vault.shared.id
}

resource "azurerm_key_vault_secret" "blob_conn" {
  name         = "${var.prefix}-${local.app_slug}-${var.env}-azure-blob-conn"
  value        = azurerm_storage_account.blob.primary_connection_string
  key_vault_id = data.azurerm_key_vault.shared.id
}

resource "azapi_resource" "api" {
  type      = "Microsoft.App/containerApps@2023-05-01"
  name      = local.api_name
  location  = var.location
  parent_id = azurerm_resource_group.app.id

  identity {
    type         = "UserAssigned"
    identity_ids = [data.azurerm_user_assigned_identity.shared.id]
  }

  body = {
    properties = {
      managedEnvironmentId = data.azurerm_container_app_environment.shared.id
      configuration = {
        activeRevisionsMode = "Single"
        ingress = {
          external      = true
          targetPort    = 4000
          allowInsecure = false
          transport     = "Auto"
          traffic = [
            { latestRevision = true, weight = 100 }
          ]
        }
        registries = [
          {
            server   = data.azurerm_container_registry.shared.login_server
            identity = data.azurerm_user_assigned_identity.shared.id
          }
        ]
        secrets = [
          {
            name        = "cosmos-url"
            identity    = data.azurerm_user_assigned_identity.shared.id
            keyVaultUrl = azurerm_key_vault_secret.cosmos_url.versionless_id
          },
          {
            name        = "cosmos-key"
            identity    = data.azurerm_user_assigned_identity.shared.id
            keyVaultUrl = azurerm_key_vault_secret.cosmos_key.versionless_id
          },
          {
            name        = "blob-conn"
            identity    = data.azurerm_user_assigned_identity.shared.id
            keyVaultUrl = azurerm_key_vault_secret.blob_conn.versionless_id
          }
        ]
      }
      template = {
        containers = [
          {
            name  = "api"
            image = local.image_api
            resources = {
              cpu    = 0.5
              memory = "1Gi"
            }
            env = [
              { name = "NODE_ENV", value = "production" },
              { name = "PORT", value = "4000" },

              { name = "COSMOS_DB_URL", secretRef = "cosmos-url" },
              { name = "COSMOS_DB_KEY", secretRef = "cosmos-key" },
              { name = "COSMOS_DB_DATABASE", value = "HorasExtrasDB" },

              { name = "TENANT_ID", value = var.tenant_id },
              { name = "CLIENT_ID", value = var.client_id },
              { name = "ALLOWED_AUDIENCE", value = coalesce(var.allowed_audience, var.client_id) },
              { name = "JWT_ISSUER", value = local.jwt_issuer },
              { name = "JWKS_URI", value = local.jwks_uri },

              { name = "AZURE_BLOB_CONN", secretRef = "blob-conn" },
              { name = "AZURE_BLOB_CONTAINER", value = var.blob_container_name },
            ]
          }
        ]
        scale = {
          minReplicas = 1
          maxReplicas = 4
        }
      }
    }
  }
}

resource "azapi_resource" "web" {
  type      = "Microsoft.App/containerApps@2023-05-01"
  name      = local.web_name
  location  = var.location
  parent_id = azurerm_resource_group.app.id

  identity {
    type         = "UserAssigned"
    identity_ids = [data.azurerm_user_assigned_identity.shared.id]
  }

  body = {
    properties = {
      managedEnvironmentId = data.azurerm_container_app_environment.shared.id
      configuration = {
        activeRevisionsMode = "Single"
        ingress = {
          external      = true
          targetPort    = 80
          allowInsecure = false
          transport     = "Auto"
          traffic = [
            { latestRevision = true, weight = 100 }
          ]
        }
        registries = [
          {
            server   = data.azurerm_container_registry.shared.login_server
            identity = data.azurerm_user_assigned_identity.shared.id
          }
        ]
      }
      template = {
        containers = [
          {
            name  = "web"
            image = local.image_web
            resources = {
              cpu    = 0.25
              memory = "0.5Gi"
            }
          }
        ]
        scale = {
          minReplicas = 1
          maxReplicas = 4
        }
      }
    }
  }
}

locals {
  api_fqdn = try(jsondecode(azapi_resource.api.output).properties.configuration.ingress.fqdn, null)
  web_fqdn = try(jsondecode(azapi_resource.web.output).properties.configuration.ingress.fqdn, null)
}
