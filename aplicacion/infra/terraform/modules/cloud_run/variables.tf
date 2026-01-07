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

variable "labels" {
  description = "Labels para los recursos"
  type        = map(string)
  default     = {}
}
