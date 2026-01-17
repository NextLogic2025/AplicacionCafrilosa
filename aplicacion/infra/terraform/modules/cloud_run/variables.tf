variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región de GCP"
  type        = string
}

variable "services" {
  description = "Lista de microservicios"
  type        = list(string)
}

variable "artifact_registry_url" {
  description = "URL del repositorio de Artifact Registry"
  type        = string
}

variable "vpc_connector_id" {
  description = "ID del VPC Access Connector"
  type        = string
}

variable "cloudsql_private_ip" {
  description = "IP privada de Cloud SQL"
  type        = string
}

variable "cloudsql_connection" {
  description = "Connection name de Cloud SQL"
  type        = string
}

# --- VARIABLES FALTANTES (AGREGADAS) ---

variable "db_password_secret_ids" {
  description = "Mapa de IDs de los secretos de base de datos para cada servicio"
  type        = map(string)
}

variable "jwt_secret_id" {
  description = "ID del secreto JWT para firma de tokens"
  type        = string
}

# ---------------------------------------

variable "labels" {
  description = "Labels para los recursos"
  type        = map(string)
  default     = {}
}

variable "gateway_sa_email" {
  description = "Email de la cuenta de servicio del API Gateway (para permitir invocación)"
  type        = string
}