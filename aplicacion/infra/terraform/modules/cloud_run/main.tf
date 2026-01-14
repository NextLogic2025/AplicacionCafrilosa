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
# IAM: Permisos específicos para leer secretos
# ============================================================

# 1. Permiso para leer la contraseña de SU base de datos (que viene del módulo database)
resource "google_secret_manager_secret_iam_member" "db_secret_access" {
  for_each = toset(var.services)

  # Usamos el ID del secreto que nos pasan como variable
  secret_id = var.db_password_secret_ids[each.key]
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa[each.key].email}"
}

# 2. Permiso para leer el JWT (Todos los servicios lo necesitan)
resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  for_each = toset(var.services)

  secret_id = var.jwt_secret_id
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

  template {
    # Service Account para el contenedor
    service_account = google_service_account.cloud_run_sa[each.key].email

    # Timeout de solicitud
    timeout = "300s"

    # Escalado automático (Scale to Zero para ahorrar dinero)
    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    # VPC Connector (acceso a BD privada)
    vpc_access {
      connector = var.vpc_connector_id
      egress    = "PRIVATE_RANGES_ONLY"  # Solo IP privadas
    }

    # Container spec
    containers {
      image = "${var.artifact_registry_url}/${each.key}:latest"

      # --- CORRECCIÓN 1: PUERTO 3000 ---
      ports {
        container_port = 3000
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
      # VARIABLES DE ENTORNO
      # ============================================================

      env {
        name  = "PORT"
        value = "3000"
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

      # --- CORRECCIÓN 2: SECRETO DE BD REAL ---
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = var.db_password_secret_ids[each.key]
            version = "latest"
          }
        }
      }

      env {
        name  = "CLOUDSQL_CONNECTION_NAME"
        value = var.cloudsql_connection
      }

      # --- CORRECCIÓN 3: INYECCIÓN DE JWT ---
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.jwt_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "LOG_LEVEL"
        value = "info"
      }

      # ============================================================
      # HEALTH CHECK: Corregido a ruta raíz "/"
      # ============================================================
      startup_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3

        http_get {
          path = "/"
          port = 3000
        }
      }

      liveness_probe {
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3

        http_get {
          path = "/"
          port = 3000
        }
      }
    }

    labels = merge(var.labels, { service = each.key })
  }

  traffic {
    type            = "TRAFFIC_TARGET_ALLOCATE_LATEST"
    latest_revision = true
  }

  labels = merge(var.labels, { service = each.key })
}

# ============================================================
# IAM: Permitir acceso público (Necesario para API Gateway o pruebas)
# ============================================================

resource "google_cloud_run_service_iam_member" "invoker" {
  # Usamos for_each porque creas varios servicios (ventas, usuarios, etc.)
  for_each = google_cloud_run_service.services

  service  = each.value.name
  location = each.value.location
  role     = "roles/run.invoker"
  
  # AQUÍ ESTÁ EL CAMBIO:
  # Solo permitimos al robot del Gateway, nadie más.
  member = "serviceAccount:${var.gateway_sa_email}"
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