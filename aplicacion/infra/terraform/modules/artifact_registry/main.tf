# ============================================================
# ARTIFACT REGISTRY: Repositorio privado de imágenes Docker
# ============================================================

resource "google_artifact_registry_repository" "cafrisales" {
  location      = var.region
  repository_id = "${var.app_name}-docker"
  format        = "DOCKER"
  description   = "Repositorio privado Docker para ${var.app_name}"
  labels        = var.labels

  # Vulnerabilidad scanning automático
  docker_config {
    immutable_tags = false
  }
}

# ============================================================
# IAM: Cloud Build puede pushear imágenes
# ============================================================

resource "google_artifact_registry_repository_iam_member" "cloud_build_push" {
  location   = google_artifact_registry_repository.cafrisales.location
  repository = google_artifact_registry_repository.cafrisales.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${var.project_id}@cloudbuild.gserviceaccount.com"
}

# ============================================================
# OUTPUTS
# ============================================================

output "repository_name" {
  value       = google_artifact_registry_repository.cafrisales.name
  description = "Nombre del repositorio de Artifact Registry"
}

output "repository_url" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.cafrisales.name}"
  description = "URL del repositorio para construir y pushear imágenes"
}

output "repository_id" {
  value       = google_artifact_registry_repository.cafrisales.id
  description = "ID del repositorio"
}
