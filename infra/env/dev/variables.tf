variable "location" {
  type    = string
  default = "eastus2"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "prefix" {
  type    = string
  default = "fsd-procesos"
}

variable "location_short" {
  type    = string
  default = "eus2"
}

variable "seq" {
  type    = string
  default = "001"
}

variable "shared_rg_name" {
  type    = string
  default = "fsd-procesos-rg-eus2-dev-001"
}

variable "shared_cae_name" {
  type    = string
  default = "fsd-procesos-cae-eus2-dev-001"
}

variable "shared_kv_name" {
  type    = string
  default = "fsd-proc-kv-eus2-dev-001"
}

variable "shared_acr_name" {
  type    = string
  default = "fsdproceus2devacr001"
}

variable "shared_umi_name" {
  type    = string
  default = "fsd-procesos-umi-aca-eus2-dev-001"
}

variable "api_image_tag" {
  type = string
}

variable "web_image_tag" {
  type = string
}

variable "tenant_id" {
  type    = string
  default = "dcbab9b3-aac5-4e0b-aea9-393574707dc3"
}

variable "client_id" {
  type        = string
  description = "App registration client id used as JWT audience."
}

variable "allowed_audience" {
  type        = string
  description = "Allowed JWT audience."
  default     = null
}

variable "blob_container_name" {
  type    = string
  default = "horas-adjuntos"
}

