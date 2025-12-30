resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "cafrilosa-repo"
  format        = "DOCKER"
  description   = "Repositorio para microservicios de la aplicación"
}