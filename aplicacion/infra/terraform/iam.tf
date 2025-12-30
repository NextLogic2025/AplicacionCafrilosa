# Cuenta de servicio para Cloud Run
resource "google_service_account" "run_sa" {
  account_id   = "cloud-run-sa"
  display_name = "Service Account para Cloud Run"
}

# Permiso para leer secretos
resource "google_secret_manager_secret_iam_member" "secret_access" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}