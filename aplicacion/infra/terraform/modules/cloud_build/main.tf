# ============================================================
# CLOUD BUILD: Triggers de CI/CD automáticos
# ============================================================

resource "google_cloudbuild_trigger" "service_triggers" {
  for_each = toset(var.services)

  name            = "${var.project_id}-${each.key}-trigger"
  description     = "Trigger de CI/CD para ${each.key}"
  location        = var.region
  filename        = "backend/services/${each.key}/cloudbuild.yaml"
  disabled        = false
  
  # Solo dispara en cambios en la carpeta del servicio
  included_files = [
    "backend/services/${each.key}/**",
    "backend/shared/**",  # Cambios en código compartido
    "infra/terraform/**"   # Cambios en IaC
  ]
  
  # Ignorar cambios en documentación
  ignored_files = [
    "docs/**",
    "README.md",
    "**/*.md"
  ]

  github {
    owner  = var.github_repo_owner
    name   = var.github_repo_name
    
    push {
      branch       = "^main$"
      invert_regex = false
    }
  }

  substitutions = {
    _SERVICE_NAME      = each.key
    _REGION            = var.region
    _ARTIFACT_REGISTRY = var.artifact_registry
    _GCP_PROJECT       = var.project_id
  }

  tags = ["${var.project_id}", each.key, "cloud-build"]
}

# ============================================================
# SERVICE ACCOUNT: Para que Cloud Build ejecute con permisos
# ============================================================

resource "google_service_account" "cloud_build_sa" {
  account_id   = "${var.project_id}-cloudbuild-sa"
  display_name = "Cloud Build Service Account"
  description  = "Service Account para Cloud Build con permisos mínimos"
}

# ============================================================
# IAM BINDINGS: Permisos para Cloud Build
# ============================================================

# Cloud Build puede escribir en Cloud Run
resource "google_project_iam_member" "cloud_build_cloud_run" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# Cloud Build puede acceder a Secret Manager
resource "google_project_iam_member" "cloud_build_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# Cloud Build puede usar Artifact Registry
resource "google_project_iam_member" "cloud_build_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# Cloud Build puede acceder a Cloud SQL
resource "google_project_iam_member" "cloud_build_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# ============================================================
# OUTPUTS
# ============================================================

output "cloud_build_trigger_names" {
  value       = { for k, v in google_cloudbuild_trigger.service_triggers : k => v.name }
  description = "Nombres de los triggers de Cloud Build"
}

output "cloud_build_sa_email" {
  value       = google_service_account.cloud_build_sa.email
  description = "Email del Service Account de Cloud Build"
}