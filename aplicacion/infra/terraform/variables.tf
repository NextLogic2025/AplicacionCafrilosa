# Variables requeridas
variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región de GCP"
  type        = string
  default     = "us-east1"
}

variable "zone" {
  description = "Zona de GCP"
  type        = string
  default     = "us-east1-b"
}

variable "environment" {
  description = "Ambiente (development, staging, production)"
  type        = string
  default     = "production"
}

variable "github_repo_owner" {
  description = "Owner del repositorio GitHub"
  type        = string
  default     = "NextLogic2025"
}

variable "github_repo_name" {
  description = "Nombre del repositorio GitHub"
  type        = string
  default     = "AplicacionCafrilosa"
}

variable "services" {
  description = "Lista de microservicios a desplegar"
  type        = list(string)
  default     = ["ventas", "usuarios", "inventario"]
}

variable "enable_deletion_protection" {
  description = "Protección contra eliminación de BD"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Días de retención de backups automáticos"
  type        = number
  default     = 30
}

variable "db_admin_user" {
  description = "Usuario admin de la base de datos"
  type        = string
  default     = "postgres"
}

locals {
  app_name = "cafrisales"
  common_labels = {
    project     = local.app_name
    environment = var.environment
    managed_by  = "terraform"
  }
}