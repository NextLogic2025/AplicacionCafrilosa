# ============================================================
# CLOUD BUILD: Triggers de CI/CD automáticos
# ============================================================

resource "google_cloudbuild_trigger" "service_triggers" {
  for_each = toset(var.services)

  name        = "${var.project_id}-${each.key}-trigger"
  description = "Trigger de CI/CD para ${each.key}"
  location    = var.region
  
  # --- CORRECCIÓN DE RUTA ---
  # Se agrega "aplicacion/" al inicio porque tu código está dentro de esa carpeta en el repo.
  # IMPORTANTE: Asegúrate de que todos tus servicios tengan un archivo llamado "cloudbuild.yaml".
  # (Si alguno se llama cloudrun.yaml, renómbralo).
  filename    = "aplicacion/backend/services/${each.key}/cloudbuild.yaml"
  
  disabled    = false
  
  # Usamos la Service Account segura creada abajo
  service_account = google_service_account.cloud_build_sa.id

  # --- CORRECCIÓN DE FILTROS ---
  # Solo dispara si hay cambios dentro de la carpeta "aplicacion/..."
  included_files = [
    "aplicacion/backend/services/${each.key}/**",
    "aplicacion/backend/shared/**",  # Si cambias código compartido, se redespliegan todos
    "aplicacion/infra/terraform/**"   # Si cambias infraestructura
  ]
  
  # Ignorar cambios en documentación
  ignored_files = [
    "docs/**",
    "README.md",
    "**/*.md"
  ]

  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    
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
  
  # Aseguramos que la SA exista y tenga permisos antes de crear el trigger
  depends_on = [
    google_project_iam_member.cloud_build_cloud_run,
    google_project_iam_member.cloud_build_artifact_registry
  ]
}

# ============================================================
# SERVICE ACCOUNT: Para que Cloud Build ejecute con permisos
# ============================================================

resource "google_service_account" "cloud_build_sa" {
  account_id   = "cloudbuild-sa"
  display_name = "Cloud Build Service Account"
  description  = "Service Account para Cloud Build con permisos mínimos"
}

# ============================================================
# IAM BINDINGS: Permisos necesarios para el Deploy
# ============================================================

# 1. Permiso para administrar Cloud Run (crear/actualizar servicios)
resource "google_project_iam_member" "cloud_build_cloud_run" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# 2. Permiso para actuar como la cuenta de servicio de los contenedores
# (Necesario para que Cloud Build pueda asignar la identidad al Cloud Run)
resource "google_project_iam_member" "cloud_build_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# 3. Permiso para leer secretos (si los necesitas durante el build)
resource "google_project_iam_member" "cloud_build_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# 4. Permiso para subir imágenes a Artifact Registry
resource "google_project_iam_member" "cloud_build_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# 5. Permiso para conectarse a SQL (útil si corres migraciones en el build step)
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
  description = "Nombres de los triggers de Cloud Build generados"
}

output "cloud_build_sa_email" {
  value       = google_service_account.cloud_build_sa.email
  description = "Email del Service Account de Cloud Build"
}