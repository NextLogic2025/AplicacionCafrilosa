resource "google_sql_database_instance" "postgres" {
  name             = "cafrilosa-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro" # Económico
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main_vpc.id
    }
  }
  deletion_protection = false
}

resource "google_sql_database" "app_db" {
  name     = "cafrilosa_db"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "db_user" {
  name     = "app_user"
  instance = google_sql_database_instance.postgres.name
  password = google_secret_manager_secret_version.db_password_version.secret_data
}