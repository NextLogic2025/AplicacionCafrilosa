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

variable "backend_urls" {
  description = "URLs de los backends de Cloud Run"
  type        = map(string)
}

variable "labels" {
  description = "Labels para los recursos"
  type        = map(string)
  default     = {}
}
