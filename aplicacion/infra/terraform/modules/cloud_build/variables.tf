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

variable "github_repo_owner" {
  description = "Owner del repositorio GitHub"
  type        = string
}

variable "github_repo_name" {
  description = "Nombre del repositorio GitHub"
  type        = string
}

variable "artifact_registry" {
  description = "Nombre del repositorio de Artifact Registry"
  type        = string
}

variable "labels" {
  description = "Labels para los recursos"
  type        = map(string)
  default     = {}
}
