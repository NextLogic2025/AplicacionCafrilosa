# ============================================================
# CLOUD RUN: Despliegue seguro de microservicios
# ============================================================

# Service Account para Cloud Run (permisos mínimos)
resource "google_service_account" "cloud_run_sa" {
  for_each = toset(var.services)

  account_id   = "${var.project_id}-${each.key}-sa"
  display_name = "Service Account para ${each.key}"
  description  = "Service Account con permisos mínimos para ${each.key}"
}

# ============================================================
# IAM: Permisos específicos para Cloud Run
# ============================================================

# Permitir Cloud Run acceder a Secret Manager
resource "google_secret_manager_secret_iam_member" "cloud_run_secrets" {
  for_each = toset(var.services)

  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa[each.key].email}"
}

# ============================================================
# CLOUD RUN SERVICES: Un servicio por microservicio
# ============================================================

resource "google_cloud_run_v2_service" "services" {
  for_each = toset(var.services)

  name     = each.key
  location = var.region

  # ============================================================
  # TEMPLATE: Especificación del contenedor
  # ============================================================
  template {
    # Service Account para el contenedor
    service_account = google_service_account.cloud_run_sa[each.key].email

    # Timeout de solicitud
    timeout = "300s"

    # Escalado automático
    scaling {
      min_instance_count = 1
      max_instance_count = 100
    }

    # VPC Connector (acceso a BD privada)
    vpc_access {
      connector = var.vpc_connector_id
      egress    = "PRIVATE_RANGES_ONLY"  # Solo IP privadas
    }

    # Container spec
    containers {
      image = "${var.artifact_registry_url}/${each.key}:latest"

      # Puerto de escucha
      ports {
        container_port = 8080
        protocol       = "TCP"
      }

      # Recursos
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      # ============================================================
      # VARIABLES DE ENTORNO: Inyectadas por Terraform
      # ============================================================

      env {
        name  = "PORT"
        value = "8080"
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = data.google_client_config.current.project
      }

      env {
        name  = "CLOUDSQL_PRIVATE_IP"
        value = var.cloudsql_private_ip
      }

      env {
        name  = "DB_HOST"
        value = var.cloudsql_private_ip
      }

      env {
        name  = "DB_NAME"
        value = "${each.key}_db"
      }

      env {
        name  = "DB_USER"
        value = "${each.key}_user"
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_passwords[each.key].id
            version = "latest"
          }
        }
      }

      env {
        name  = "CLOUDSQL_CONNECTION_NAME"
        value = var.cloudsql_connection
      }

      env {
        name  = "LOG_LEVEL"
        value = "info"
      }

      # ============================================================
      # HEALTH CHECK: Readiness probe
      # ============================================================
      startup_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 10
        period_seconds        = 10
        failure_threshold     = 3

        http_get {
          path = "/health"
          port = 8080
        }
      }

      liveness_probe {
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3

        http_get {
          path = "/health"
          port = 8080
        }
      }
    }

    labels = merge(var.labels, { service = each.key })
  }

  # ============================================================
  # TRAFFIC: Dirigir al template más reciente
  # ============================================================
  traffic {
    type            = "TRAFFIC_TARGET_ALLOCATE_LATEST"
    latest_revision = true
  }

  # Etiquetas
  labels = merge(var.labels, { service = each.key })
}

# ============================================================
# SECRET MANAGER: Credenciales de BD (sincronizado con DB)
# ============================================================

resource "google_secret_manager_secret" "db_passwords" {
  for_each = toset(var.services)

  secret_id = "${var.project_id}-${each.key}-db-password"
  labels    = merge(var.labels, { service = each.key })

  replication {
    automatic = true
  }
}

# ============================================================
# IAM: Permitir Cloud Run acceder a servicios
# ============================================================

# No permitir invocación pública (solo API Gateway)
resource "google_cloud_run_service_iam_member" "no_public_access" {
  for_each = toset(var.services)

  service  = google_cloud_run_v2_service.services[each.key].name
  location = google_cloud_run_v2_service.services[each.key].location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${data.google_client_config.current.project}@cloudbuild.gserviceaccount.com"
}

# ============================================================
# DATA SOURCE: Configuración actual
# ============================================================

data "google_client_config" "current" {}

# ============================================================
# OUTPUTS
# ============================================================

output "service_urls" {
  value = {
    for k, v in google_cloud_run_v2_service.services : k => v.uri
  }
  description = "URLs de los servicios Cloud Run"
}

output "cloud_run_service_accounts" {
  value = {
    for k, v in google_service_account.cloud_run_sa : k => v.email
  }
  description = "Service Accounts de Cloud Run"
}
