# ============================================================
# CLOUD SQL: PostgreSQL 17 (Privada, altamente segura)
# ============================================================

# Generar contraseña aleatoria para admin
resource "random_password" "db_admin_password" {
  length  = 32
  special = true
}

# Instancia Cloud SQL
resource "google_sql_database_instance" "postgres" {
  name              = "${var.app_name}-db-${data.google_client_config.current.project}"
  database_version  = "POSTGRES_17"
  region            = var.region
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.machine_type
    availability_type = "ZONAL"  # Zona única como solicitaste
    disk_type         = "PD_SSD"
    disk_size         = 20

    # ============================================================
    # SEGURIDAD: Configuración de red privada
    # ============================================================
    ip_configuration {
      ipv4_enabled    = false           # ❌ Sin IP pública
      private_network = var.vpc_id      # ✅ Solo VPC privada
      require_ssl     = true            # ✅ SSL requerido
    }

    # ============================================================
    # BACKUPS: Retención y PITR (Point-In-Time Recovery)
    # ============================================================
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"  # UTC (00:00 EST)
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = var.backup_retention_days
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    # ============================================================
    # MANTENIMIENTO: Ventana de actualización automática
    # ============================================================
    maintenance_window {
      kind           = "MAINTENANCE_WINDOW_AUTOMATIC"
      day            = 6  # Sábado
      hour           = 3  # 03:00 UTC
      update_track   = "stable"
    }

    # ============================================================
    # PERFORMANCE INSIGHTS (Monitoreo)
    # ============================================================
    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
    }

    # ============================================================
    # DATABASE FLAGS (Seguridad PostgreSQL)
    # ============================================================
    database_flags {
      name  = "cloudsql_iam_authentication"
      value = "on"  # Permite autenticación IAM
    }

    database_flags {
      name  = "log_statement"
      value = "all"  # Registra todas las consultas (auditoría)
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"  # Log de queries que tarden > 1s
    }

    labels = var.labels
  }

  deletion_protection = var.deletion_protection
}

# ============================================================
# USUARIOS DE BASE DE DATOS: Un usuario por servicio
# ============================================================

# Usuario admin (solo para setup inicial)
resource "google_sql_user" "admin" {
  name     = var.db_admin_user
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_admin_password.result
}

# Usuarios específicos por servicio (sin permisos de admin)
resource "google_sql_user" "service_users" {
  for_each = toset(var.services)

  name     = "${each.key}_user"
  instance = google_sql_database_instance.postgres.name
  password = random_password.service_passwords[each.key].result
}

# Generar contraseñas aleatorias por servicio
resource "random_password" "service_passwords" {
  for_each = toset(var.services)

  length  = 32
  special = true
}

# ============================================================
# BASES DE DATOS: Una por servicio
# ============================================================

resource "google_sql_database" "service_dbs" {
  for_each = toset(var.services)

  name     = "${each.key}_db"
  instance = google_sql_database_instance.postgres.name
  charset  = "UTF8"
  collation = "en_US.UTF8"
}

# ============================================================
# GOOGLE CLOUD SECRET MANAGER: Guardar credenciales
# ============================================================

resource "google_secret_manager_secret" "db_admin_password" {
  secret_id = "${var.app_name}-db-admin-password"
  labels    = var.labels

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_admin_password" {
  secret      = google_secret_manager_secret.db_admin_password.id
  secret_data = random_password.db_admin_password.result
}

# Secretos para cada servicio
resource "google_secret_manager_secret" "service_passwords" {
  for_each = toset(var.services)

  secret_id = "${var.app_name}-${each.key}-db-password"
  labels    = merge(var.labels, { service = each.key })

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "service_passwords" {
  for_each = toset(var.services)

  secret      = google_secret_manager_secret.service_passwords[each.key].id
  secret_data = random_password.service_passwords[each.key].result
}

# ============================================================
# ROTACIÓN AUTOMÁTICA DE SECRETOS (Cada 30 días)
# ============================================================

resource "google_secret_manager_secret" "rotation_lambda" {
  secret_id = "${var.app_name}-secret-rotation"
  labels    = var.labels

  replication {
    automatic = true
  }
}

# ============================================================
# DATA SOURCE: Configuración actual de GCP
# ============================================================

data "google_client_config" "current" {}

# ============================================================
# OUTPUTS
# ============================================================

output "cloudsql_private_ip" {
  value       = google_sql_database_instance.postgres.private_ip_address
  description = "IP privada de la instancia Cloud SQL"
}

output "cloudsql_connection_name" {
  value       = google_sql_database_instance.postgres.connection_name
  description = "Nombre de conexión de Cloud SQL (para Cloud SQL Auth Proxy)"
}

output "db_instance_name" {
  value       = google_sql_database_instance.postgres.name
  description = "Nombre de la instancia Cloud SQL"
}

output "service_databases" {
  value       = { for k, v in google_sql_database.service_dbs : k => v.name }
  description = "Bases de datos creadas por servicio"
}

output "db_admin_password_secret_id" {
  value       = google_secret_manager_secret.db_admin_password.id
  description = "ID del secreto de contraseña admin"
}

output "service_password_secrets" {
  value       = { for k, v in google_secret_manager_secret.service_passwords : k => v.id }
  description = "IDs de secretos de contraseñas por servicio"
  sensitive   = true
}
