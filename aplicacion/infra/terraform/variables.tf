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

# --- CORRECCIÓN IMPORTANTE: LISTA DE SERVICIOS REAL ---
variable "services" {
  description = "Lista de microservicios a desplegar"
  type        = list(string)
  # Agregamos 'auth', 'catalog', 'orders' que vimos en las carpetas.
  # Mantenemos 'inventario' solo si planean subir código pronto.
  default     = ["auth", "catalog", "orders", "usuarios", "finance", "warehouse"]
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

# --- NUEVAS VARIABLES NECESARIAS PARA EL MÓDULO CLOUD RUN ---
# (Agregamos estas porque las referenciamos en el main.tf corregido anteriormente)

variable "db_password_secret_ids" {
  description = "Map de IDs de secretos de base de datos (se pasa desde outputs, puede estar vacío aquí)"
  type        = map(string)
  default     = {} 
}

variable "jwt_secret_id" {
  description = "ID del secreto JWT (se pasa desde outputs, puede estar vacío aquí)"
  type        = string
  default     = ""
}
# ------------------------------------------------------------

locals {
  app_name = "cafrisales"
  common_labels = {
    project     = local.app_name
    environment = var.environment
    managed_by  = "terraform"
  }
}