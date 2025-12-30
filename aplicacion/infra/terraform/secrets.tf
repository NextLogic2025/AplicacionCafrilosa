resource "google_secret_manager_secret" "db_password" {
  secret_id = "DB_PASSWORD"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

# Aquí defines el valor inicial (puedes cambiarlo luego en la consola)
resource "google_secret_manager_secret_version" "db_password_version" {
  secret     = google_secret_manager_secret.db_password.id
  secret_data = "password_seguro_123" 
}