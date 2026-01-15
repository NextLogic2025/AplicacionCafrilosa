# ============================================================
# DATA SOURCE: Para obtener el Project Number dinámicamente
# ============================================================
data "google_project" "project" {}

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
    immutable_tags = false # Permite sobrescribir tags como 'latest' o 'v1'
  }
}

# ============================================================
# IAM: Cloud Build puede pushear imágenes
# ============================================================

resource "google_artifact_registry_repository_iam_member" "cloud_build_push" {
  location   = google_artifact_registry_repository.cafrisales.location
  repository = google_artifact_registry_repository.cafrisales.name
  role       = "roles/artifactregistry.writer"
  
  # CORRECCIÓN IMPORTANTE: Usamos el Project Number, no el ID
  member     = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}

# ============================================================
# OUTPUTS
# ============================================================

output "repository_name" {
  value       = google_artifact_registry_repository.cafrisales.name
  description = "Nombre completo del recurso (projects/.../locations/...)"
}

output "repository_url" {
  # CORRECCIÓN IMPORTANTE: Usamos repository_id para armar la URL limpia
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.cafrisales.repository_id}"
  description = "URL del repositorio para construir y pushear imágenes"
}

output "repository_id" {
  value       = google_artifact_registry_repository.cafrisales.repository_id
  description = "ID corto del repositorio"
}