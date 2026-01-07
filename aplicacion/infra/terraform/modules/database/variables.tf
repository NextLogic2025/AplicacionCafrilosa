variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región de GCP"
  type        = string
}

variable "zone" {
  description = "Zona de GCP"
  type        = string
}

variable "services" {
  description = "Lista de microservicios"
  type        = list(string)
}

variable "vpc_id" {
  description = "ID de la VPC para la red privada"
  type        = string
}

variable "deletion_protection" {
  description = "Protección contra eliminación de la instancia"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Días de retención de backups"
  type        = number
  default     = 30
}

variable "db_admin_user" {
  description = "Usuario admin de la base de datos"
  type        = string
  default     = "postgres"
}

variable "machine_type" {
  description = "Tipo de máquina para Cloud SQL"
  type        = string
  default     = "db-f1-micro"
}

variable "app_name" {
  description = "Nombre de la aplicación"
  type        = string
  default     = "cafrisales"
}

variable "labels" {
  description = "Labels para los recursos"
  type        = map(string)
  default     = {}
}
